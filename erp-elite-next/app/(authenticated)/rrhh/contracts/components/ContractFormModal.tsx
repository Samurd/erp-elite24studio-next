"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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
import { CalendarIcon, Loader2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RichSelect } from "@/components/ui/rich-select"
import MoneyInput from "@/components/ui/money-input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useEffect, useState, useRef } from "react"
import { DateService } from "@/lib/date-service"
import ModelAttachments, { ModelAttachmentsRef } from "@/components/cloud/ModelAttachments"
import { uploadFile, attachFileToModel } from "@/actions/files"

const EMPTY_FILES: any[] = []

const contractSchema = z.object({
    employee_id: z.string().min(1, "El empleado es obligatorio"),
    type_id: z.string().min(1, "El tipo de contrato es obligatorio"),
    category_id: z.string().min(1, "La categoría es obligatoria"),
    status_id: z.string().min(1, "El estado es obligatorio"),
    start_date: z.date({ message: "La fecha de inicio es obligatoria" }),
    end_date: z.date().optional().nullable(),
    amount: z.number().optional(),
    schedule_id: z.string().optional().nullable(),
})

type ContractFormValues = z.infer<typeof contractSchema>

interface ContractFormModalProps {
    open: boolean
    onClose: () => void
    contract?: any
    isReadOnly?: boolean
    employees: any[]
    typeOptions: any[]
    categoryOptions: any[]
    statusOptions: any[]
    scheduleOptions: any[]
}

// ... imports remain the same, just remove ModelAttachmentsCreator usage below

export function ContractFormModal({
    open,
    onClose,
    contract,
    isReadOnly = false,
    employees,
    typeOptions,
    categoryOptions,
    statusOptions,
    scheduleOptions
}: ContractFormModalProps) {
    const queryClient = useQueryClient()
    const isEditing = !!contract
    const attachmentsRef = useRef<ModelAttachmentsRef>(null)
    const [currentData, setCurrentData] = useState<any>(contract || null)

    useEffect(() => {
        const fetchFullData = async () => {
            // ... existing fetch logic
            if (contract?.id && open) {
                const url = `/api/rrhh/contracts/${contract.id}?t=${Date.now()}`
                try {
                    const res = await fetch(url)
                    if (res.ok) {
                        const fullData = await res.json()
                        setCurrentData(fullData)
                    } else {
                        console.error(`Failed to fetch contract data from ${url}. Status: ${res.status}`)
                        if (!currentData) setCurrentData(contract)
                    }
                } catch (error) {
                    console.error(`Error fetching full contract data from ${url}:`, error)
                }
            } else {
                if (!isEditing) setCurrentData(null)
            }
        }
        fetchFullData()
    }, [contract, open, isEditing])

    const refreshData = async () => {
        if (currentData?.id) {
            const url = `/api/rrhh/contracts/${currentData.id}?t=${Date.now()}`
            try {
                const res = await fetch(url)
                if (res.ok) {
                    const freshData = await res.json()
                    setCurrentData(freshData)
                }
            } catch (error) {
                console.error(`Error refreshing data from ${url}:`, error)
            }
        }
    }

    const form = useForm<ContractFormValues>({
        resolver: zodResolver(contractSchema),
        defaultValues: {
            employee_id: "",
            type_id: "",
            category_id: "",
            status_id: "",
            start_date: undefined,
            end_date: undefined,
            amount: 0,
            schedule_id: "",
        },
    })

    useEffect(() => {
        if (contract && isEditing) {
            form.reset({
                employee_id: contract.employeeId?.toString() || "",
                type_id: contract.typeId?.toString() || "",
                category_id: contract.categoryId?.toString() || "",
                status_id: contract.statusId?.toString() || "",
                start_date: contract.startDate ? DateService.parseToDate(contract.startDate) : undefined,
                end_date: contract.endDate ? DateService.parseToDate(contract.endDate) : undefined,
                amount: contract.amount ? parseFloat(contract.amount) : 0,
                schedule_id: contract.scheduleId?.toString() || "",
            })
        } else {
            form.reset({
                employee_id: "",
                type_id: "",
                category_id: "",
                status_id: "",
                start_date: undefined,
                end_date: undefined,
                amount: 0,
                schedule_id: "",
            })
        }
    }, [contract, isEditing, form, open])

    const mutation = useMutation({
        mutationFn: async (data: ContractFormValues) => {
            const url = isEditing
                ? `/api/rrhh/contracts/${contract.id}`
                : "/api/rrhh/contracts"

            const method = isEditing ? "PUT" : "POST"

            // 1. Upload files
            const fileIds = await attachmentsRef.current?.upload() || []

            const payload = {
                ...data,
                start_date: DateService.toDB(data.start_date),
                end_date: data.end_date ? DateService.toDB(data.end_date) : null,
                employee_id: parseInt(data.employee_id),
                type_id: parseInt(data.type_id),
                category_id: parseInt(data.category_id),
                status_id: parseInt(data.status_id),
                schedule_id: data.schedule_id ? parseInt(data.schedule_id) : null,
                pending_file_ids: fileIds
            }

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            if (!res.ok) throw new Error("Error saving contract")
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contracts"] })
            toast.success(isEditing ? "Contrato actualizado" : "Contrato creado")
            onClose()
            form.reset()
        },
        onError: () => {
            toast.error("Error al guardar el contrato")
        }
    })

    const onSubmit = (data: ContractFormValues) => {
        mutation.mutate(data)
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isReadOnly ? "Detalles del Contrato" : (isEditing ? "Editar Contrato" : "Nuevo Contrato")}
                    </DialogTitle>
                    <DialogDescription>
                        {isReadOnly ? "Información detallada del contrato" : "Diligencie la información del contrato"}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <fieldset disabled={isReadOnly} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="employee_id"
                                render={({ field }) => (
                                    <FormItem className="col-span-1 md:col-span-2">
                                        <FormLabel>Empleado <span className="text-red-500">*</span></FormLabel>
                                        <RichSelect
                                            options={employees.map((emp) => ({
                                                ...emp,
                                                id: emp.id.toString(),
                                                name: emp.fullName || emp.full_name,
                                            }))}
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            placeholder="Seleccionar empleado"
                                            imageKey="profile_photo_url"
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="type_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Contrato <span className="text-red-500">*</span></FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar tipo" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {typeOptions.map((opt) => (
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
                                name="category_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Categoría <span className="text-red-500">*</span></FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar categoría" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {categoryOptions.map((opt) => (
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
                                name="status_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estado <span className="text-red-500">*</span></FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar estado" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {statusOptions.map((opt) => (
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
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Salario / Monto</FormLabel>
                                        <FormControl>
                                            <MoneyInput
                                                value={field.value || 0}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="start_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Fecha Inicio <span className="text-red-500">*</span></FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP", { locale: es })
                                                        ) : (
                                                            <span>Seleccionar fecha</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) => date < new Date("1900-01-01")}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="end_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Fecha Fin</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP", { locale: es })
                                                        ) : (
                                                            <span>Seleccionar fecha</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value || undefined}
                                                    onSelect={field.onChange}
                                                    disabled={(date) => date < new Date("1900-01-01")}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="schedule_id"
                                render={({ field }) => (
                                    <FormItem className="col-span-1 md:col-span-2">
                                        <FormLabel>Horario Laboral</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || ""}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar horario" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {scheduleOptions.map((opt) => (
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
                        </fieldset>
                        <div className="mt-6 border-t pt-4">
                            <h3 className="text-lg font-semibold mb-4">Archivos Adjuntos</h3>
                            <ModelAttachments
                                ref={attachmentsRef}
                                areaSlug="rrhh"
                                modelType="App\Models\Contract"
                                modelId={currentData?.id}
                                initialFiles={currentData?.files || EMPTY_FILES}
                                onUpdate={refreshData}
                                readOnly={isReadOnly}
                            />
                        </div>


                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancelar
                            </Button>
                            {!isReadOnly && (
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isEditing ? "Actualizar" : "Guardar"}
                                </Button>
                            )}
                        </DialogFooter>
                    </form >
                </Form >
            </DialogContent >
        </Dialog >
    )
}
