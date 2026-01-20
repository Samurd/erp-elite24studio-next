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

const applicantSchema = z.object({
    full_name: z.string().min(1, "El nombre es obligatorio"),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    vacancy_id: z.string().min(1, "La vacante es obligatoria"),
    status_id: z.string().min(1, "El estado es obligatorio"),
    notes: z.string().optional(),
})

type ApplicantFormValues = z.infer<typeof applicantSchema>

interface ApplicantFormProps {
    initialData?: any
    isEditing?: boolean
    vacancies: any[]
    statuses: any[]
    onSuccess?: () => void
}

export function ApplicantForm({
    initialData,
    isEditing = false,
    vacancies,
    statuses,
    onSuccess
}: ApplicantFormProps) {
    const queryClient = useQueryClient()

    const form = useForm<ApplicantFormValues>({
        resolver: zodResolver(applicantSchema),
        defaultValues: {
            full_name: "",
            email: "",
            vacancy_id: "",
            status_id: "",
            notes: "",
        }
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                full_name: initialData.full_name || initialData.fullName || "",
                email: initialData.email || "",
                vacancy_id: initialData.vacancy_id?.toString() || initialData.vacancyId?.toString() || initialData.vacancy?.id?.toString() || "",
                status_id: initialData.status_id?.toString() || initialData.statusId?.toString() || initialData.status?.id?.toString() || "",
                notes: initialData.notes || "",
            })
        } else {
            form.reset({
                full_name: "",
                email: "",
                vacancy_id: "",
                status_id: "",
                notes: "",
            })
        }
    }, [initialData, form])

    const mutation = useMutation({
        mutationFn: async (data: ApplicantFormValues) => {
            const url = isEditing
                ? `/api/rrhh/applicants/${initialData.id}`
                : "/api/rrhh/applicants"

            const method = isEditing ? "PUT" : "POST"

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                const error = await res.text();
                throw new Error(error || "Error saving applicant");
            }
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["applicants"] })
            toast.success(isEditing ? "Postulante actualizado" : "Postulante creado")
            if (onSuccess) onSuccess()
        },
        onError: (error) => {
            toast.error(error.message || "Error al guardar el postulante")
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/rrhh/applicants/${initialData.id}`, {
                method: "DELETE"
            })
            if (!res.ok) throw new Error("Error deleting applicant")
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["applicants"] })
            toast.success("Postulante eliminado")
            if (onSuccess) onSuccess()
        }
    })

    const onSubmit = (data: ApplicantFormValues) => {
        mutation.mutate(data)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="bg-white rounded-lg p-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

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
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl><Input {...field} type="email" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="vacancy_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Vacante <span className="text-red-500">*</span></FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar vacante" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {vacancies.map((vacancy) => (
                                                <SelectItem key={vacancy.id} value={vacancy.id.toString()}>
                                                    {vacancy.title}
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

                        <div className="md:col-span-2">
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notas / Observaciones</FormLabel>
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
                                    if (confirm("¿Eliminar postulante?")) deleteMutation.mutate()
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
