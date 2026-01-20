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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, Trash, CalendarIcon } from "lucide-react"
import Link from "next/link"
import { RichSelect } from "@/components/ui/rich-select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import MoneyInput from "@/components/ui/money-input"
import { DateService } from "@/lib/date-service"
import ModelAttachments from "@/components/cloud/ModelAttachments"
import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"

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

interface ContractFormProps {
    initialData?: any
    isCreating?: boolean
    isEditing?: boolean
    isReadOnly?: boolean
    employees: any[]
    typeOptions: any[]
    categoryOptions: any[]
    statusOptions: any[]
    scheduleOptions: any[]
}

export function ContractForm({
    initialData,
    isCreating = false,
    isEditing = false,
    isReadOnly = false,
    employees,
    typeOptions,
    categoryOptions,
    statusOptions,
    scheduleOptions
}: ContractFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()

    const form = useForm<ContractFormValues>({
        resolver: zodResolver(contractSchema),
        defaultValues: {
            employee_id: initialData?.employeeId?.toString() || "",
            type_id: initialData?.typeId?.toString() || "",
            category_id: initialData?.categoryId?.toString() || "",
            status_id: initialData?.statusId?.toString() || "",
            start_date: DateService.parseToDate(initialData?.startDate),
            end_date: DateService.parseToDate(initialData?.endDate),
            amount: initialData?.amount ? parseFloat(initialData.amount) : 0,
            schedule_id: initialData?.scheduleId?.toString() || "",
        },
        disabled: isReadOnly
    })

    // Fetch full details if editing to get files
    const { data: fullContract } = useQuery({
        queryKey: ["contract-full", initialData?.id],
        queryFn: async () => {
            if (!initialData?.id || !isEditing) return null;
            const res = await fetch(`/api/rrhh/contracts/${initialData.id}`);
            if (!res.ok) throw new Error("Failed to fetch details");
            return res.json();
        },
        enabled: !!initialData?.id && isEditing,
    });

    const mutation = useMutation({
        mutationFn: async (data: ContractFormValues) => {
            const url = isEditing
                ? `/api/rrhh/contracts/${initialData.id}`
                : "/api/rrhh/contracts"

            const method = isEditing ? "PUT" : "POST"

            // Format dates
            const payload = {
                ...data,
                start_date: DateService.toInput(data.start_date),
                end_date: data.end_date ? DateService.toInput(data.end_date) : null,
                employee_id: parseInt(data.employee_id),
                type_id: parseInt(data.type_id),
                category_id: parseInt(data.category_id),
                status_id: parseInt(data.status_id),
                schedule_id: data.schedule_id ? parseInt(data.schedule_id) : null,
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
            router.push("/rrhh/contracts")
        },
        onError: () => {
            toast.error("Error al guardar el contrato")
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/rrhh/contracts/${initialData.id}`, {
                method: "DELETE"
            })
            if (!res.ok) throw new Error("Error deleting contract")
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contracts"] })
            toast.success("Contrato eliminado")
            router.push("/rrhh/contracts")
        }
    })

    const onSubmit = (data: ContractFormValues) => {
        mutation.mutate(data)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div className="flex flex-col gap-1">
                            <CardTitle>
                                {isReadOnly ? "Detalle del Contrato" : isCreating ? "Nuevo Contrato" : isEditing ? "Editar Contrato" : "Nuevo Contrato"}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {isReadOnly ? "Información detallada del contrato" : "Diligencie la información del contrato"}
                            </p>
                        </div>
                        <Button variant="outline" asChild size="sm">
                            <Link href="/rrhh/contracts">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">

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
                                            name: emp.full_name
                                        }))}
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        placeholder="Seleccionar empleado"
                                        imageKey="profile_photo_url"
                                        disabled={isReadOnly}
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
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={isReadOnly}
                                    >
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
                                    <FormLabel>Categoría / Tipo Relación <span className="text-red-500">*</span></FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={isReadOnly}
                                    >
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
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={isReadOnly}
                                    >
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
                                            disabled={isReadOnly}
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
                                                    disabled={isReadOnly}
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
                                                disabled={(date) =>
                                                    date < new Date("1900-01-01")
                                                }
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
                                                    disabled={isReadOnly}
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
                                                disabled={(date) =>
                                                    date < new Date("1900-01-01")
                                                }
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
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value || undefined}
                                        disabled={isReadOnly}
                                    >
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

                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Archivos Adjuntos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ModelAttachments
                            initialFiles={fullContract?.files || initialData?.files || []}
                            modelId={initialData?.id}
                            modelType="App\Models\Contract"
                            onUpdate={() => {
                                queryClient.invalidateQueries({ queryKey: ["contracts"] })
                                queryClient.invalidateQueries({ queryKey: ["contract-full", initialData?.id] })
                            }}
                            readOnly={isReadOnly}
                        />
                    </CardContent>
                </Card>

                {!isReadOnly && (
                    <div className="flex justify-end gap-3">
                        {isEditing && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => {
                                    if (confirm("¿Eliminar contrato?")) deleteMutation.mutate()
                                }}
                                className="mr-auto"
                            >
                                <Trash className="mr-2 h-4 w-4" /> Eliminar
                            </Button>
                        )}
                        <Button type="button" variant="ghost" asChild>
                            <Link href="/rrhh/contracts">Cancelar</Link>
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {isEditing ? "Actualizar" : "Guardar"}
                        </Button>
                    </div>
                )}

                {isReadOnly && (
                    <div className="flex justify-end gap-3">
                        <div className="mr-auto"></div>
                        <Button asChild variant="default">
                            <Link href={`/rrhh/contracts/${initialData?.id}?edit=true`}>
                                <Save className="mr-2 h-4 w-4" /> Editar
                            </Link>
                        </Button>
                    </div>
                )}

            </form>
        </Form>
    )
}
