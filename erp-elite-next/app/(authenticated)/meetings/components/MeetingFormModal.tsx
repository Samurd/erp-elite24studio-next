"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Users, Link as LinkIcon, Calendar, Clock, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { RichSelect } from "@/components/ui/rich-select"
import { DateService } from "@/lib/date-service"

interface MeetingFormModalProps {
    open: boolean
    onClose: () => void
    mode: "create" | "edit" | "view"
    meeting?: any
    statusOptions: any[]
    teamOptions: any[]
    userOptions: any[]
}

export default function MeetingFormModal({
    open,
    onClose,
    mode,
    meeting,
    statusOptions,
    teamOptions,
    userOptions
}: MeetingFormModalProps) {
    const queryClient = useQueryClient()
    const isView = mode === "view"

    const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
        defaultValues: {
            title: "",
            date: "",
            start_time: "",
            end_time: "",
            team_id: "",
            status_id: "",
            notes: "",
            observations: "",
            url: "",
            goal: false,
            responsibles: [] as string[] // Changed to string array for native select multiple
        }
    })

    const selectedResponsibles = watch("responsibles")

    useEffect(() => {
        if (open) {
            if (meeting) {
                setValue("title", meeting.title)
                setValue("date", meeting.date)
                setValue("start_time", meeting.startTime ? meeting.startTime.substring(0, 5) : "")
                setValue("end_time", meeting.endTime ? meeting.endTime.substring(0, 5) : "")
                setValue("team_id", meeting.teamId?.toString() || "")
                setValue("status_id", meeting.statusId?.toString() || "")
                setValue("notes", meeting.notes || "")
                setValue("observations", meeting.observations || "")
                setValue("url", meeting.url || "")
                setValue("goal", meeting.goal === 1)

                // Responsibles
                if (meeting.responsibles) {
                    setValue("responsibles", meeting.responsibles.map((r: any) => r.id.toString()))
                }
            } else {
                reset({
                    title: "",
                    date: DateService.todayInput(),
                    start_time: "",
                    end_time: "",
                    team_id: "",
                    status_id: "",
                    notes: "",
                    observations: "",
                    url: "",
                    goal: false,
                    responsibles: []
                })
            }
        }
    }, [open, meeting, setValue, reset])

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch("/api/meetings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            })
            if (!res.ok) throw new Error("Failed to create meeting")
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["meetings"] })
            toast.success("Reunión creada exitosamente")
            onClose()
        },
        onError: (err: any) => toast.error(err.message)
    })

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`/api/meetings/${meeting.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            })
            if (!res.ok) throw new Error("Failed to update meeting")
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["meetings"] })
            toast.success("Reunión actualizada exitosamente")
            onClose()
        },
        onError: (err: any) => toast.error(err.message)
    })

    const onSubmit = (data: any) => {
        // Convert responsibility strings back to numbers if needed by API, 
        // essentially the API expects array of user IDs.
        const formattedData = {
            ...data,
            responsibles: data.responsibles
        }

        if (mode === "create") {
            createMutation.mutate(formattedData)
        } else if (mode === "edit") {
            updateMutation.mutate(formattedData)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-h-[90vh] min-w-[50vw] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create' ? 'Nueva Reunión' : mode === 'edit' ? 'Editar Reunión' : 'Detalles de la Reunión'}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'create' ? 'Complete los datos para agendar una nueva reunión.' :
                            mode === 'edit' ? 'Modifique los datos de la reunión.' :
                                'Información completa de la reunión.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title">Título de la Reunión *</Label>
                            <Input id="title" {...register("title", { required: true })} disabled={isView} />
                            {errors.title && <span className="text-sm text-red-500">Requerido</span>}
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date">Fecha *</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                    <Input id="date" type="date" className="pl-9" {...register("date", { required: true })} disabled={isView} />
                                </div>
                                {errors.date && <span className="text-sm text-red-500">Requerido</span>}
                            </div>
                            <div className="space-y-2">
                                <Label>Horario *</Label>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                        <Input type="time" className="pl-9" {...register("start_time", { required: true })} disabled={isView} />
                                    </div>
                                    <span>-</span>
                                    <div className="relative flex-1">
                                        <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                        <Input type="time" className="pl-9" {...register("end_time", { required: true })} disabled={isView} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Team & Status */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="team_id">Equipo Responsable</Label>
                                <select
                                    id="team_id"
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    {...register("team_id")}
                                    disabled={isView}
                                >
                                    <option value="">Seleccionar equipo...</option>
                                    {teamOptions.map(team => (
                                        <option key={team.id} value={team.id}>{team.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status_id">Estado</Label>
                                <select
                                    id="status_id"
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    {...register("status_id")}
                                    disabled={isView}
                                >
                                    <option value="">Seleccionar estado...</option>
                                    {statusOptions.map(status => (
                                        <option key={status.id} value={status.id}>{status.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Responsibles */}
                        <div className="space-y-2">
                            <Label>Responsables</Label>
                            <RichSelect
                                options={userOptions}
                                value={watch("responsibles")}
                                onValueChange={(val) => {
                                    if (isView) return
                                    if (Array.isArray(val)) {
                                        setValue("responsibles", val)
                                    }
                                }}
                                placeholder="Seleccionar responsables..."
                                multiple
                                disabled={isView}
                            />
                        </div>

                        {/* URL */}
                        <div className="space-y-2">
                            <Label htmlFor="url">URL de la Reunión</Label>
                            <div className="relative">
                                <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                <Input id="url" type="url" className="pl-9" {...register("url")} placeholder="https://..." disabled={isView} />
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notas Previas</Label>
                            <Textarea id="notes" {...register("notes")} rows={3} placeholder="Agenda, temas..." disabled={isView} />
                        </div>

                        {/* Observations */}
                        <div className="space-y-2">
                            <Label htmlFor="observations">Observaciones Finales</Label>
                            <Textarea id="observations" {...register("observations")} rows={3} placeholder="Conclusiones..." disabled={isView} />
                        </div>

                        {/* Goal */}
                        <div className="flex items-center space-x-2 border p-3 rounded-lg bg-gray-50">
                            <Checkbox
                                id="goal"
                                checked={watch("goal")}
                                onCheckedChange={(checked) => !isView && setValue("goal", checked as boolean)}
                                disabled={isView}
                            />
                            <Label htmlFor="goal" className="flex items-center gap-2 font-medium cursor-pointer">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                Meta Cumplida
                            </Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            {isView ? 'Cerrar' : 'Cancelar'}
                        </Button>
                        {!isView && (
                            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : (mode === 'create' ? 'Guardar' : 'Actualizar')}
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
