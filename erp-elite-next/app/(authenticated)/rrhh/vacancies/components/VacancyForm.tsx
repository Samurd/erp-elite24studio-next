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
import { Loader2, Trash } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useEffect } from "react"
import { RichSelect } from "@/components/ui/rich-select"
import { DateService } from "@/lib/date-service"

const vacancySchema = z.object({
    title: z.string().min(1, "El título es obligatorio"),
    area: z.string().min(1, "El área es obligatoria"),
    contract_type_id: z.string().min(1, "El tipo de contrato es obligatorio"),
    published_at: z.string().optional(),
    status_id: z.string().min(1, "El estado es obligatorio"),
    user_id: z.string().min(1, "El responsable es obligatorio"),
    description: z.string().optional(),
})

type VacancyFormValues = z.infer<typeof vacancySchema>

interface VacancyFormProps {
    initialData?: any
    isEditing?: boolean
    contractTypes: any[]
    statuses: any[]
    rrhhUsers: any[]
    onSuccess?: () => void
}

export function VacancyForm({
    initialData,
    isEditing = false,
    contractTypes,
    statuses,
    rrhhUsers,
    onSuccess
}: VacancyFormProps) {
    const queryClient = useQueryClient()

    const form = useForm<VacancyFormValues>({
        resolver: zodResolver(vacancySchema),
        defaultValues: {
            title: "",
            area: "",
            contract_type_id: "",
            published_at: DateService.todayInput(),
            status_id: "",
            user_id: "",
            description: "",
        }
    })

    useEffect(() => {
        console.log('VacancyForm FULL initialData:', initialData);
        if (initialData) {
            // Extract IDs properly from the API response
            const contractTypeId = initialData.contract_type_id?.toString()
                || initialData.contractTypeId?.toString()
                || "";

            const statusId = initialData.status_id?.toString()
                || initialData.statusId?.toString()
                || "";

            const userId = initialData.user_id?.toString()
                || initialData.userId?.toString()
                || initialData.user?.id?.toString() // Fallback to nested user object if flattened ID not present
                || "";

            console.log('--- DEBUG FORM VALUES ---');
            console.log('Raw contractTypeId:', initialData.contract_type_id, typeof initialData.contract_type_id);
            console.log('Raw statusId:', initialData.status_id, typeof initialData.status_id);
            console.log('Raw userId:', initialData.user_id, typeof initialData.user_id);
            console.log('Converted contractTypeId:', contractTypeId);
            console.log('Converted statusId:', statusId);
            console.log('Converted userId:', userId);
            console.log('-------------------------');

            form.reset({
                title: initialData.title || "",
                area: initialData.area || "",
                contract_type_id: contractTypeId,
                published_at: DateService.toInput(initialData.published_at || initialData.publishedAt),
                status_id: statusId,
                user_id: userId,
                description: initialData.description || "",
            })
        } else {
            console.log('No initialData, resetting to defaults');
            form.reset({
                title: "",
                area: "",
                contract_type_id: "",
                published_at: DateService.todayInput(),
                status_id: "",
                user_id: "",
                description: "",
            })
        }
    }, [initialData, form])

    const mutation = useMutation({
        mutationFn: async (data: VacancyFormValues) => {
            const url = isEditing
                ? `/api/rrhh/vacancies/${initialData.id}`
                : "/api/rrhh/vacancies"

            const method = isEditing ? "PUT" : "POST"

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                const error = await res.text();
                throw new Error(error || "Error saving vacancy");
            }
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vacancies"] })
            toast.success(isEditing ? "Vacante actualizada" : "Vacante creada")
            if (onSuccess) onSuccess()
        },
        onError: (error) => {
            toast.error(error.message || "Error al guardar la vacante")
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/rrhh/vacancies/${initialData.id}`, {
                method: "DELETE"
            })
            if (!res.ok) throw new Error("Error deleting vacancy")
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vacancies"] })
            toast.success("Vacante eliminada")
            if (onSuccess) onSuccess()
        }
    })

    const onSubmit = (data: VacancyFormValues) => {
        console.log('Submitting vacancy data:', data);
        mutation.mutate(data)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="bg-white rounded-lg p-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <div className="md:col-span-2">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Título de la Vacante <span className="text-red-500">*</span></FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="area"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Área / Departamento <span className="text-red-500">*</span></FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="contract_type_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Contrato <span className="text-red-500">*</span></FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value?.toString()}
                                        defaultValue={field.value?.toString()}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar tipo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {contractTypes.map((type) => (
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
                            name="status_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Estado <span className="text-red-500">*</span></FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value?.toString()}
                                        defaultValue={field.value?.toString()}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar estado" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {statuses.map((status) => (
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
                            name="user_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Responsable <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <RichSelect
                                            options={rrhhUsers}
                                            value={field.value || undefined}
                                            onValueChange={(val) => field.onChange(val ? String(val) : "")}
                                            placeholder="Seleccionar responsable"
                                            imageKey="profilePhotoPath"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="published_at"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha de Publicación</FormLabel>
                                    <FormControl><Input {...field} type="date" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="md:col-span-2">
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descripción</FormLabel>
                                        <FormControl><Textarea {...field} rows={6} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 mt-4 border-t gap-2">
                        {isEditing && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => {
                                    if (confirm("¿Eliminar vacante?")) deleteMutation.mutate()
                                }}
                            >
                                <Trash className="h-4 w-4 mr-2" /> Eliminar
                            </Button>
                        )}
                        <Button type="submit" disabled={mutation.isPending} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? "Actualizar" : "Guardar"}
                        </Button>
                    </div>
                </div>
            </form>
        </Form>
    )
}
