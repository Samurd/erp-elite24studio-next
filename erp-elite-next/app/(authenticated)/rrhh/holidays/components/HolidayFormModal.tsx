
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DateService } from "@/lib/date-service";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RichSelect } from "@/components/ui/rich-select";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import ModelAttachmentsCreator from "@/components/cloud/ModelAttachmentsCreator";
import ModelAttachments from "@/components/cloud/ModelAttachments";

const formSchema = z.object({
    employee_id: z.string().min(1, "El empleado es requerido"),
    type_id: z.string().optional(),
    start_date: z.string().min(1, "La fecha de inicio es requerida"),
    end_date: z.string().min(1, "La fecha de fin es requerida"),
    status_id: z.string().optional(),
    approver_id: z.string().optional(),
});

interface HolidayFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    holiday?: any;
}

export function HolidayFormModal({
    open,
    onOpenChange,
    holiday,
}: HolidayFormModalProps) {
    const queryClient = useQueryClient();
    const [files, setFiles] = useState<File[]>([]);
    const [pendingCloudFiles, setPendingCloudFiles] = useState<any[]>([]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            employee_id: "",
            type_id: "",
            start_date: DateService.todayInput(),
            end_date: DateService.todayInput(),
            status_id: "",
            approver_id: "",
        },
    });

    // Fetch full details if editing to get files
    const { data: fullHoliday, isLoading: isLoadingDetails } = useQuery({
        queryKey: ["holiday-full", holiday?.id],
        queryFn: async () => {
            if (!holiday?.id) return null;
            const res = await fetch(`/api/rrhh/holidays/${holiday.id}`);
            if (!res.ok) throw new Error("Failed to fetch details");
            return res.json();
        },
        enabled: !!holiday?.id && open,
    });

    // Reset form when opening/changing holiday or when full details load
    useEffect(() => {
        if (open) {
            setFiles([]);
            setPendingCloudFiles([]);

            if (holiday) {
                // Use fullHoliday if available, otherwise fallback to basic holiday prop (though fullHoliday is preferred for files)
                const dataToUse = fullHoliday || holiday;

                form.reset({
                    employee_id: dataToUse.employeeId?.toString() || "",
                    type_id: dataToUse.typeId?.toString() || "",
                    start_date: DateService.toInput(dataToUse.startDate),
                    end_date: DateService.toInput(dataToUse.endDate),
                    status_id: dataToUse.statusId?.toString() || "",
                    approver_id: dataToUse.approverId?.toString() || "",
                });
            } else {
                form.reset({
                    employee_id: "",
                    type_id: "",
                    start_date: DateService.todayInput(),
                    end_date: DateService.todayInput(),
                    status_id: "",
                    approver_id: "",
                });
            }
        }
    }, [open, holiday, fullHoliday, form]);

    // Fetch Options
    const { data: options } = useQuery({
        queryKey: ["rrhh-options-form"],
        queryFn: async () => {
            // We need employees and users additionally, so separate calls or modify api.
            // Given the options API returns everything based on includes, we can try to fetch them.
            // But usually options API requires specific flags.
            // Let's assume standard options return some and we might need to add specific logic for employees if the dropdown is huge, but usually loaded.
            // Based on API: 'include=employees' and 'include=users' works.
            const res = await fetch("/api/rrhh/options?slug=tipo_vacacion&include=employees&include2=users");
            return res.json();
        },
        staleTime: 1000 * 60 * 5,
        enabled: open,
    });

    const mutation = useMutation({
        mutationFn: async (values: z.infer<typeof formSchema>) => {
            const url = holiday ? `/api/rrhh/holidays/${holiday.id}` : "/api/rrhh/holidays";
            const method = holiday ? "PUT" : "POST";

            // Upload files first if any (for new creation with files)
            const uploadedFileIds: number[] = [];
            if (files.length > 0) {
                const { uploadFile } = await import("@/actions/files");
                for (const file of files) {
                    const formData = new FormData();
                    formData.append('file', file);
                    const res = await uploadFile(formData);
                    if (res.success && res.file) {
                        uploadedFileIds.push(res.file.id);
                    }
                }
            }

            const pendingIds = pendingCloudFiles.map(f => f.id);
            const allPendingIds = [...uploadedFileIds, ...pendingIds];

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...values,
                    pending_file_ids: allPendingIds
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Error al guardar");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["holidays"] });
            toast.success("Éxito", {
                description: holiday
                    ? "Solicitud actualizada correctamente"
                    : "Solicitud creada correctamente",
            });
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error("Error", {
                description: error.message || "Ocurrió un error al guardar"
            })
        }
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        mutation.mutate(values);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{holiday ? "Editar Solicitud" : "Nueva Solicitud"}</DialogTitle>
                    <DialogDescription>
                        {holiday ? "Modifique los datos de la solicitud." : "Complete la información para registrar una nueva ausencia o vacación."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div className="md:col-span-2 border-b pb-2 mb-2">
                                <h3 className="font-semibold text-gray-800">Información General</h3>
                            </div>

                            <FormField
                                control={form.control}
                                name="employee_id"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Empleado <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <RichSelect
                                                options={options?.employees?.map((emp: any) => ({
                                                    ...emp,
                                                    id: emp.id.toString(),
                                                    name: emp.fullName
                                                })) || []}
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                placeholder="Seleccionar empleado"
                                                imageKey="profile_photo_url" // Assuming this exists or falls back
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="type_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar tipo" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {options?.holidayTypeOptions?.map((type: any) => (
                                                    <SelectItem key={type.id} value={type.id.toString()}>
                                                        {type.name}
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
                                name="start_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha Inicio <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="end_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha Fin <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="status_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estado</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar estado" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {options?.holidayStatusOptions?.map((status: any) => (
                                                    <SelectItem key={status.id} value={status.id.toString()}>
                                                        {status.name}
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
                                name="approver_id"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Aprobador</FormLabel>
                                        <FormControl>
                                            <RichSelect
                                                options={options?.users?.map((user: any) => ({
                                                    ...user,
                                                    id: user.id.toString(),
                                                    name: user.name
                                                })) || []}
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                placeholder="Seleccionar aprobador"
                                                imageKey="profile_photo_url"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Files Section */}
                            <div className="md:col-span-2 mt-4">
                                <FormLabel className="mb-2 block text-lg font-semibold border-b pb-2">Soportes / Archivos Adjuntos</FormLabel>
                                {holiday ? (
                                    <ModelAttachments
                                        initialFiles={fullHoliday?.files || []}
                                        modelId={holiday.id}
                                        modelType="App\Models\Holiday"
                                        onUpdate={() => {
                                            queryClient.invalidateQueries({ queryKey: ["holidays"] });
                                        }}
                                    />
                                ) : (
                                    <ModelAttachmentsCreator
                                        files={files}
                                        onFilesChange={setFiles}
                                        pendingCloudFiles={pendingCloudFiles}
                                        onPendingCloudFilesChange={setPendingCloudFiles}
                                    />
                                )}
                            </div>

                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={mutation.isPending} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                                {mutation.isPending && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                                {holiday ? "Actualizar" : "Guardar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
