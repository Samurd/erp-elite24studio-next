"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner" // Assuming sonner is used for toasts, or standard toast
import ModelAttachmentsCreator from "@/components/cloud/ModelAttachmentsCreator"
import ModelAttachments from "@/components/cloud/ModelAttachments"
import { DateService } from "@/lib/date-service"

interface ReportFormModalProps {
    open: boolean
    onClose: () => void
    report?: any | null
    statusOptions: any[] // { id: number, name: string }[]
}

export default function ReportFormModal({ open, onClose, report, statusOptions }: ReportFormModalProps) {
    const isEdit = !!report
    const queryClient = useQueryClient()

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        date: "",
        hour: "",
        status_id: "",
        notes: "",
    })

    const [files, setFiles] = useState<File[]>([])
    const [pendingCloudFiles, setPendingCloudFiles] = useState<any[]>([])

    // Fetch full report details including files when in edit mode
    const { data: reportDetails } = useQuery({
        queryKey: ["report", report?.id],
        queryFn: async () => {
            if (!report?.id) return null
            const res = await fetch(`/api/reports/${report.id}`)
            if (!res.ok) throw new Error("Failed to fetch report details")
            return res.json()
        },
        enabled: !!report?.id && open
    })

    const effectiveReport = reportDetails || report

    useEffect(() => {
        if (effectiveReport) {
            setFormData({
                title: effectiveReport.title || "",
                description: effectiveReport.description || "",
                date: effectiveReport.date || "",
                hour: effectiveReport.hour || "",
                status_id: effectiveReport.statusId?.toString() || "",
                notes: effectiveReport.notes || "",
            })
        } else {
            setFormData({
                title: "",
                description: "",
                date: DateService.todayInput(),
                hour: "",
                status_id: "",
                notes: "",
            })
        }
    }, [effectiveReport, open])

    useEffect(() => {
        if (!open) {
            setFiles([])
            setPendingCloudFiles([])
        }
    }, [open])

    const mutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const url = isEdit ? `/api/reports/${report.id}` : "/api/reports"
            const method = isEdit ? "PUT" : "POST"


            // File upload logic
            const uploadedFileIds = []
            const { uploadFile } = await import("@/actions/files")

            if (files.length > 0) {
                for (const file of files) {
                    const formData = new FormData()
                    formData.append('file', file)
                    const res = await uploadFile(formData)
                    if (res.success && res.file) {
                        uploadedFileIds.push(res.file.id)
                    }
                }
            }

            const pendingIds = pendingCloudFiles.map(f => f.id)
            const allFileIds = [...uploadedFileIds, ...pendingIds]

            const payload = { ...data, pending_file_ids: allFileIds }

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || "Error saving report")
            }

            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["reports"] })
            toast.success(isEdit ? "Reporte actualizado" : "Reporte creado")
            onClose()
        },
        onError: (error: any) => {
            toast.error(error.message)
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        mutation.mutate(formData)
    }

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Editar Reporte" : "Nuevo Reporte"}</DialogTitle>
                    <DialogDescription>
                        Complete la información del reporte.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Title */}
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="title">Título</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                            />
                        </div>

                        {/* Date */}
                        <div className="space-y-2">
                            <Label htmlFor="date">Fecha</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>

                        {/* Hour */}
                        <div className="space-y-2">
                            <Label htmlFor="hour">Hora</Label>
                            <Input
                                id="hour"
                                type="time"
                                value={formData.hour}
                                onChange={(e) => setFormData({ ...formData, hour: e.target.value })}
                            />
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <Label>Estado</Label>
                            <Select
                                value={formData.status_id}
                                onValueChange={(val) => setFormData({ ...formData, status_id: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((option) => (
                                        <SelectItem key={option.id} value={option.id.toString()}>
                                            {option.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Notes */}
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="notes">Notas</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={3}
                            />
                        </div>

                        {/* Attachments */}
                        <div className="md:col-span-2 space-y-2">
                            <Label className="mb-2 block">Archivos Adjuntos</Label>
                            {isEdit ? (
                                report && (
                                    <ModelAttachments
                                        initialFiles={effectiveReport.files || []}
                                        modelId={effectiveReport.id}
                                        modelType="App\Models\Report"
                                        onUpdate={() => {
                                            queryClient.invalidateQueries({ queryKey: ["report", effectiveReport.id] })
                                            queryClient.invalidateQueries({ queryKey: ["reports"] })
                                        }}
                                    />
                                )
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
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? "Guardando..." : "Guardar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
