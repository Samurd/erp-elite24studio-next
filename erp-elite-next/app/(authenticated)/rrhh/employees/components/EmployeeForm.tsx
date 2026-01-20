"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Trash } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Plus } from "lucide-react"
import ModelAttachmentsCreator from "@/components/cloud/ModelAttachmentsCreator"
import ModelAttachments from "@/components/cloud/ModelAttachments"
import { useState, useEffect } from "react"
import { uploadFile } from "@/actions/files"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DateService } from "@/lib/date-service"

const employeeSchema = z.object({
    // Work
    full_name: z.string().min(1, "El nombre es obligatorio"),
    job_title: z.string().min(1, "El cargo es obligatorio"),
    work_email: z.string().email("Email inválido"),
    mobile_phone: z.string().min(1, "El celular es obligatorio"),
    work_address: z.string().min(1, "La dirección laboral es obligatoria"),
    work_schedule: z.string().min(1, "El horario es obligatorio"),
    department_id: z.string().min(1, "El departamento es obligatorio"),

    // Private
    identification_number: z.string().min(1, "La identificación es obligatoria"),
    passport_number: z.string().optional(),
    personal_email: z.string().email("Email inválido").optional().or(z.literal("")),
    private_phone: z.string().optional(),
    home_address: z.string().optional(),
    bank_account: z.string().optional(),
    social_security_number: z.string().optional(),
    gender_id: z.string().optional(),
    birth_date: z.string().optional(),
    birth_place: z.string().optional(),
    birth_country: z.string().optional(),
    has_disability: z.boolean().default(false),
    disability_details: z.string().optional(),

    // Contact
    emergency_contact_name: z.string().optional(),
    emergency_contact_phone: z.string().optional(),

    // Education & Family
    education_type_id: z.string().optional(),
    marital_status_id: z.string().optional(),
    number_of_dependents: z.coerce.number().min(0).default(0),

    // Files
    pending_file_ids: z.array(z.number()).optional(),
})

type EmployeeFormValues = z.infer<typeof employeeSchema>

interface EmployeeFormProps {
    initialData?: any
    isEditing?: boolean
    departments: any[]
    genderOptions: any[]
    educationOptions: any[]
    maritalStatusOptions: any[]
}

interface FileModel {
    id: number;
    name: string;
    size: number | null;
    url: string;
}

export function EmployeeForm({
    initialData,
    isEditing = false,
    departments,
    genderOptions,
    educationOptions,
    maritalStatusOptions
}: EmployeeFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [currentData, setCurrentData] = useState(initialData)
    const [files, setFiles] = useState<File[]>([])
    const [pendingCloudFiles, setPendingCloudFiles] = useState<FileModel[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [showDepartmentModal, setShowDepartmentModal] = useState(false)
    const [newDepartmentName, setNewDepartmentName] = useState("")

    const form = useForm({
        resolver: zodResolver(employeeSchema),
        defaultValues: {
            full_name: "",
            job_title: "",
            work_email: "",
            mobile_phone: "",
            work_address: "",
            work_schedule: "40 hours/week",
            department_id: "",
            identification_number: "",
            passport_number: "",
            personal_email: "",
            private_phone: "",
            home_address: "",
            bank_account: "",
            social_security_number: "",
            gender_id: "",
            birth_date: "",
            birth_place: "",
            birth_country: "",
            has_disability: false,
            disability_details: "",
            emergency_contact_name: "",
            emergency_contact_phone: "",
            education_type_id: "",
            marital_status_id: "",
            number_of_dependents: 0,
            pending_file_ids: []
        }
    })

    // Fetch full data when form opens in edit mode
    useEffect(() => {
        const fetchFullData = async () => {
            if (initialData && isEditing && initialData.id) {
                try {
                    const res = await fetch(`/api/rrhh/employees/${initialData.id}`);
                    if (res.ok) {
                        const fullData = await res.json();
                        setCurrentData(fullData);
                    }
                } catch (error) {
                    console.error("Error fetching full employee data:", error);
                    setCurrentData(initialData);
                }
            } else {
                setCurrentData(initialData);
            }
        };

        fetchFullData();
    }, [initialData, isEditing]);

    const refreshData = async () => {
        if (currentData?.id) {
            try {
                const res = await fetch(`/api/rrhh/employees/${currentData.id}`);
                if (res.ok) {
                    const freshData = await res.json();
                    setCurrentData(freshData);
                }
            } catch (error) {
                // console.error("Error refreshing employee data:", error);
            }
        }
    };

    useEffect(() => {
        if (currentData) {
            // console.log("Resetting form with currentData:", currentData);
            form.reset({
                full_name: currentData.fullName || currentData.full_name || "",
                job_title: currentData.jobTitle || currentData.job_title || "",
                work_email: currentData.workEmail || currentData.work_email || "",
                mobile_phone: currentData.mobilePhone || currentData.mobile_phone || "",
                work_address: currentData.workAddress || currentData.work_address || "",
                work_schedule: currentData.workSchedule || currentData.work_schedule || "40 hours/week",
                department_id: currentData.department?.id?.toString() || currentData.departmentId?.toString() || currentData.department_id?.toString() || "",

                identification_number: currentData.identificationNumber || currentData.identification_number || "",
                passport_number: currentData.passportNumber || currentData.passport_number || "",
                personal_email: currentData.personalEmail || currentData.personal_email || "",
                private_phone: currentData.privatePhone || currentData.private_phone || "",
                home_address: currentData.homeAddress || currentData.home_address || "",
                bank_account: currentData.bankAccount || currentData.bank_account || "",
                social_security_number: currentData.socialSecurityNumber || currentData.social_security_number || "",
                gender_id: currentData.genderId?.toString() || currentData.gender_id?.toString() || "",
                // Handle date string (YYYY-MM-DD or ISO)
                birth_date: DateService.toInput(currentData.birthDate || currentData.birth_date),
                birth_place: currentData.birthPlace || currentData.birth_place || "",
                birth_country: currentData.birthCountry || currentData.birth_country || "",
                has_disability: currentData.hasDisability === 1 || currentData.hasDisability === true || currentData.has_disability === 1 || currentData.has_disability === true,
                disability_details: currentData.disabilityDetails || currentData.disability_details || "",

                emergency_contact_name: currentData.emergencyContactName || currentData.emergency_contact_name || "",
                emergency_contact_phone: currentData.emergencyContactPhone || currentData.emergency_contact_phone || "",

                education_type_id: currentData.educationTypeId?.toString() || currentData.education_type_id?.toString() || "",
                marital_status_id: currentData.maritalStatusId?.toString() || currentData.marital_status_id?.toString() || "",
                number_of_dependents: currentData.numberOfDependents ?? currentData.number_of_dependents ?? 0,
                pending_file_ids: []
            })
        }
    }, [currentData, form])

    const mutation = useMutation({
        mutationFn: async (data: EmployeeFormValues) => {
            const url = isEditing
                ? `/api/rrhh/employees/${initialData.id}`
                : "/api/rrhh/employees"

            const method = isEditing ? "PUT" : "POST"

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                const error = await res.text();
                throw new Error(error || "Error saving employee");
            }
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["employees"] })
            toast.success(isEditing ? "Empleado actualizado" : "Empleado creado")
            router.push("/rrhh/employees")
        },
        onError: (error) => {
            toast.error(error.message || "Error al guardar el empleado")
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/rrhh/employees/${initialData.id}`, {
                method: "DELETE"
            })
            if (!res.ok) throw new Error("Error deleting employee")
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["employees"] })
            toast.success("Empleado eliminado")
            router.push("/rrhh/employees")
        }
    })

    const onSubmit = async (data: EmployeeFormValues) => {
        setIsUploading(true);
        try {
            const uploadedFileIds: number[] = [];

            // Upload new files
            if (files.length > 0) {
                for (const file of files) {
                    const formData = new FormData();
                    formData.append('file', file);
                    const result = await uploadFile(formData);
                    if (result.success && result.file) {
                        uploadedFileIds.push(result.file.id);
                    } else {
                        toast.error(`Error al subir ${file.name}`);
                        setIsUploading(false);
                        return;
                    }
                }
            }

            // Combine uploaded IDs with pending cloud IDs
            const cloudIds = pendingCloudFiles.map(f => f.id);
            data.pending_file_ids = [...cloudIds, ...uploadedFileIds];

            mutation.mutate(data);
        } catch (error) {
            console.error("Upload error", error);
            toast.error("Error preparando archivos");
        } finally {
            setIsUploading(false);
        }
    }

    const createDepartmentMutation = useMutation({
        mutationFn: async (name: string) => {
            const res = await fetch("/api/rrhh/departments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) throw new Error("Error creating department");
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["rrhh-options"] });
            toast.success("Departamento creado");
            form.setValue("department_id", data.id.toString());
            setShowDepartmentModal(false);
            setNewDepartmentName("");
        },
        onError: () => {
            toast.error("Error al crear departamento");
        }
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">


                {/* Header */}
                <div className="bg-white rounded-lg p-6 shadow-sm border flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            {isEditing ? "Editar Empleado" : "Nuevo Empleado"}
                        </h1>
                        <p className="text-gray-500">Diligencie la información personal y laboral</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/rrhh/employees">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                            </Link>
                        </Button>
                        {isEditing && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => {
                                    if (confirm("¿Eliminar empleado?")) deleteMutation.mutate()
                                }}
                            >
                                <Trash className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <Tabs defaultValue="work" className="w-full">
                        <TabsList className="w-full justify-start rounded-none border-b bg-gray-50 p-0 h-auto gap-0">
                            <TabsTrigger value="work" className="rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-600 data-[state=active]:bg-white data-[state=active]:shadow-none px-6 py-3">Laboral</TabsTrigger>
                            <TabsTrigger value="private" className="rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-600 data-[state=active]:bg-white data-[state=active]:shadow-none px-6 py-3">Privada & Documentos</TabsTrigger>
                            <TabsTrigger value="contact" className="rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-600 data-[state=active]:bg-white data-[state=active]:shadow-none px-6 py-3">Contacto Emergencia</TabsTrigger>
                            <TabsTrigger value="education" className="rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-600 data-[state=active]:bg-white data-[state=active]:shadow-none px-6 py-3">Educación & Familia</TabsTrigger>
                            <TabsTrigger value="files" className="rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-600 data-[state=active]:bg-white data-[state=active]:shadow-none px-6 py-3">Archivos</TabsTrigger>
                        </TabsList>

                        <div className="p-6">
                            {/* Work Tab */}
                            <TabsContent value="work" className="mt-0 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="full_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre Completo <span className="text-red-500">*</span></FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="job_title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Cargo <span className="text-red-500">*</span></FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="work_email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email Trabajo <span className="text-red-500">*</span></FormLabel>
                                                <FormControl><Input {...field} type="email" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="mobile_phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Celular Móvil <span className="text-red-500">*</span></FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="department_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Departamento <span className="text-red-500">*</span></FormLabel>
                                                <div className="flex gap-2">
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Seleccionar departamento" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {departments.map((dept) => (
                                                                <SelectItem key={dept.id} value={dept.id.toString()}>
                                                                    {dept.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => setShowDepartmentModal(true)}
                                                        title="Crear departamento"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="work_schedule"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Horario <span className="text-red-500">*</span></FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="work_address"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel>Dirección Trabajo <span className="text-red-500">*</span></FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </TabsContent>

                            {/* Private Tab */}
                            <TabsContent value="private" className="mt-0 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="identification_number"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Número Identificación <span className="text-red-500">*</span></FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="passport_number"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Número Pasaporte</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="personal_email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email Personal</FormLabel>
                                                <FormControl><Input {...field} type="email" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="private_phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Teléfono Privado</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="home_address"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel>Dirección Hogar</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="bank_account"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Cuenta Bancaria</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="social_security_number"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Seguridad Social / EPS</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="gender_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Género</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Seleccionar" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {genderOptions.map((opt) => (
                                                            <SelectItem key={opt.id} value={opt.id.toString()}>
                                                                {opt.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="birth_date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Fecha Nacimiento</FormLabel>
                                                <FormControl><Input {...field} type="date" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="birth_place"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Lugar Nacimiento</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="birth_country"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>País Nacimiento</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="has_disability"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 rounded-md border md:col-span-2">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel>Tiene Discapacidad</FormLabel>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                    {form.watch("has_disability") && (
                                        <FormField
                                            control={form.control}
                                            name="disability_details"
                                            render={({ field }) => (
                                                <FormItem className="md:col-span-2">
                                                    <FormLabel>Detalles Discapacidad</FormLabel>
                                                    <FormControl><Textarea {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>
                            </TabsContent>

                            {/* Contact Tab */}
                            <TabsContent value="contact" className="mt-0 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="emergency_contact_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre Contacto</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="emergency_contact_phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Teléfono Contacto</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </TabsContent>

                            {/* Education Tab */}
                            <TabsContent value="education" className="mt-0 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="education_type_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nivel Educativo</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Seleccionar" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {educationOptions.map((opt) => (
                                                            <SelectItem key={opt.id} value={opt.id.toString()}>
                                                                {opt.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="marital_status_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Estado Civil</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Seleccionar" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {maritalStatusOptions.map((opt) => (
                                                            <SelectItem key={opt.id} value={opt.id.toString()}>
                                                                {opt.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="number_of_dependents"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Número de Dependientes</FormLabel>
                                                <FormControl><Input {...field} value={field.value ?? 0} onChange={(e) => field.onChange(e.target.valueAsNumber)} type="number" min="0" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="files" className="mt-0 space-y-6">
                                {currentData && currentData.id ? (
                                    <ModelAttachments
                                        initialFiles={currentData?.files || []}
                                        modelId={currentData.id}
                                        modelType="App\Models\Employee"
                                        onUpdate={refreshData}
                                    />
                                ) : (
                                    <ModelAttachmentsCreator
                                        files={files}
                                        onFilesChange={setFiles}
                                        pendingCloudFiles={pendingCloudFiles}
                                        onPendingCloudFilesChange={setPendingCloudFiles}
                                    />
                                )}
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                <div className="flex justify-end pt-4 border-t">
                    <Button type="submit" disabled={mutation.isPending || isUploading} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                        {(mutation.isPending || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? "Actualizar Información" : "Guardar Empleado"}
                    </Button>
                </div>
            </form>

            {/* Department Creation Modal */}
            <Dialog open={showDepartmentModal} onOpenChange={setShowDepartmentModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Crear Departamento</DialogTitle>
                        <DialogDescription>
                            Ingrese el nombre del nuevo departamento
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            placeholder="Nombre del departamento"
                            value={newDepartmentName}
                            onChange={(e) => setNewDepartmentName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && newDepartmentName.trim()) {
                                    e.preventDefault();
                                    createDepartmentMutation.mutate(newDepartmentName);
                                }
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setShowDepartmentModal(false);
                                setNewDepartmentName("");
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={() => createDepartmentMutation.mutate(newDepartmentName)}
                            disabled={!newDepartmentName.trim() || createDepartmentMutation.isPending}
                        >
                            {createDepartmentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Form>
    )
}
