
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Option } from "@/types"
import { useEffect } from "react"
import { RichSelect } from "@/components/ui/rich-select"
import { DateService } from "@/lib/date-service"

const formSchema = z.object({
    applicant_id: z.string().min(1, "El postulante es requerido"),
    date: z.string().min(1, "La fecha es requerida"),
    time: z.string().optional(),
    interviewer_id: z.string().optional(),
    interview_type_id: z.string().optional(),
    status_id: z.string().optional(),
    result_id: z.string().optional(),
    platform: z.string().optional(),
    platform_url: z.string().url("URL inválida").optional().or(z.literal("")),
    expected_results: z.string().optional(),
    interviewer_observations: z.string().optional(),
    rating: z.string().optional() // Handles number input as string
})

interface InterviewFormProps {
    initialData?: any
    isEditing?: boolean
    applicants: { id: number; fullName: string }[]
    interviewers: { id: number; name: string }[]
    types: Option[]
    statuses: Option[]
    results: Option[]
    onSuccess?: () => void
}

export function InterviewForm({
    initialData,
    isEditing = false,
    applicants = [],
    interviewers = [],
    types = [],
    statuses = [],
    results = [],
    onSuccess
}: InterviewFormProps) {
    const queryClient = useQueryClient()

    // Helper to safely extract ID as string from either camelCase, snake_case, or relation object
    const getSafeId = (data: any, keyDetails: { camel: string, snake: string, relation?: string }) => {
        if (!data) return "";
        // 1. Try camelCase (e.g. applicantId)
        let val = data[keyDetails.camel];
        // 2. Try snake_case (e.g. applicant_id)
        if (val === undefined || val === null) val = data[keyDetails.snake];
        // 3. Try relation object (e.g. applicant.id)
        if ((val === undefined || val === null) && keyDetails.relation) {
            val = data[keyDetails.relation]?.id;
        }

        return val !== null && val !== undefined ? val.toString() : "";
    };

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            applicant_id: "",
            date: DateService.todayInput(),
            time: "",
            interviewer_id: "",
            interview_type_id: "",
            status_id: "",
            result_id: "",
            platform: "",
            platform_url: "",
            expected_results: "",
            interviewer_observations: "",
            rating: ""
        },
    })

    // Reset form when initialData changes
    useEffect(() => {
        if (initialData) {
            console.log("DEBUG: InterviewForm initialData", initialData);

            form.reset({
                applicant_id: getSafeId(initialData, { camel: 'applicantId', snake: 'applicant_id', relation: 'applicant' }),
                date: initialData.date ? DateService.toInput(initialData.date) : DateService.todayInput(),
                time: initialData.time?.substring(0, 5) || "",
                // Interviewer is a User (UUID)
                interviewer_id: getSafeId(initialData, { camel: 'interviewerId', snake: 'interviewer_id', relation: 'interviewer' }),
                interview_type_id: getSafeId(initialData, { camel: 'interviewTypeId', snake: 'interview_type_id', relation: 'interviewType' }),
                status_id: getSafeId(initialData, { camel: 'statusId', snake: 'status_id', relation: 'status' }),
                result_id: getSafeId(initialData, { camel: 'resultId', snake: 'result_id', relation: 'result' }),
                platform: initialData.platform || "",
                platform_url: initialData.platformUrl || "",
                expected_results: initialData.expectedResults || "",
                interviewer_observations: initialData.interviewerObservations || "",
                rating: initialData.rating?.toString() || ""
            })
        } else {
            form.reset({
                applicant_id: "",
                date: DateService.todayInput(),
                time: "",
                interviewer_id: "",
                interview_type_id: "",
                status_id: "",
                result_id: "",
                platform: "",
                platform_url: "",
                expected_results: "",
                interviewer_observations: "",
                rating: "" // Rating string
            })
        }
    }, [initialData, form])


    const mutation = useMutation({
        mutationFn: async (values: z.infer<typeof formSchema>) => {
            const url = isEditing
                ? `/api/rrhh/interviews/${initialData.id}`
                : "/api/rrhh/interviews"

            const method = isEditing ? "PUT" : "POST"

            // Format date using DateService
            const payload = {
                ...values,
                date: DateService.toDB(new Date(values.date))
            }

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            if (!res.ok) throw new Error("Error al guardar la entrevista")
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["interviews"] })
            queryClient.invalidateQueries({ queryKey: ["calendar-events"] })
            toast.success(isEditing ? "Entrevista actualizada" : "Entrevista creada")
            if (onSuccess) onSuccess()
        },
        onError: () => {
            toast.error("Error al guardar la entrevista")
        }
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        mutation.mutate(values)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* General Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <FormField
                            control={form.control}
                            name="applicant_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Postulante <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Select onValueChange={field.onChange} value={field.value?.toString()}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar postulante" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {applicants.map((app) => (
                                                    <SelectItem key={app.id} value={app.id.toString()}>
                                                        {app.fullName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fecha <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="time"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Hora</FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="interviewer_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Entrevistador</FormLabel>
                                <FormControl>
                                    <RichSelect
                                        options={interviewers}
                                        value={field.value || undefined} // Pass string directly
                                        onValueChange={(val) => field.onChange(val)} // Value is already string/number union
                                        placeholder="Seleccionar entrevistador"
                                        imageKey="profilePhotoPath"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="interview_type_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de Entrevista</FormLabel>
                                <FormControl>
                                    <Select onValueChange={field.onChange} value={field.value?.toString()}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {types.map((type) => (
                                                <SelectItem key={type.id} value={type.id.toString()}>
                                                    {type.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="border-t pt-4">
                    <h3 className="text-md font-medium text-gray-900 mb-3">Detalles de Conexión</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="platform"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Plataforma</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. Google Meet, Zoom" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="platform_url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>URL de Reunión</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="border-t pt-4">
                    <h3 className="text-md font-medium text-gray-900 mb-3">Resultados y Evaluación</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="status_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Estado</FormLabel>
                                    <FormControl>
                                        <Select onValueChange={field.onChange} value={field.value?.toString()}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar estado" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {statuses.map((s) => (
                                                    <SelectItem key={s.id} value={s.id.toString()}>
                                                        {s.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="result_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Resultado</FormLabel>
                                    <FormControl>
                                        <Select onValueChange={field.onChange} value={field.value?.toString()}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar resultado" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {results.map((r) => (
                                                    <SelectItem key={r.id} value={r.id.toString()}>
                                                        {r.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="rating"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Calificación (0-10)</FormLabel>
                                    <FormControl>
                                        <Input type="number" min="0" max="10" step="0.1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="md:col-span-2">
                            <FormField
                                control={form.control}
                                name="interviewer_observations"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Observaciones</FormLabel>
                                        <FormControl>
                                            <Textarea rows={3} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" type="button" onClick={onSuccess}>Cancelar</Button>
                    <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700" disabled={mutation.isPending}>
                        {mutation.isPending ? "Guardando..." : (isEditing ? "Actualizar" : "Guardar")}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
