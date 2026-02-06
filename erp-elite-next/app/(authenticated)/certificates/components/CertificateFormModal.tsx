"use client"

import { useState, useEffect, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import ModelAttachments, { ModelAttachmentsRef } from "@/components/cloud/ModelAttachments"
import { FileIcon, ExternalLink } from "lucide-react"
import { RichSelect } from "@/components/ui/rich-select"
import { DateService } from "@/lib/date-service"

interface CertificateFormModalProps {
    open: boolean
    onClose: () => void
    certificate?: any | null
    mode?: "create" | "edit" | "view"
    typeOptions: any[]
    statusOptions: any[]
    userOptions: any[]
}

export default function CertificateFormModal({
    open,
    onClose,
    certificate: initialCertificate,
    mode = "create",
    typeOptions,
    statusOptions,
    userOptions
}: CertificateFormModalProps) {
    const isView = mode === "view"
    const isEdit = mode === "edit" || mode === "view"
    const isCreate = mode === "create"

    const queryClient = useQueryClient()
    const attachmentsRef = useRef<ModelAttachmentsRef>(null)

    // Fetch full certificate details including files
    const { data: fetchedCertificate, isLoading } = useQuery({
        queryKey: ["certificate", initialCertificate?.id],
        queryFn: async () => {
            if (!initialCertificate?.id) return null
            const res = await fetch(`/api/certificates/${initialCertificate.id}`)
            if (!res.ok) throw new Error("Failed to fetch certificate")
            return res.json()
        },
        enabled: open && !!initialCertificate?.id && (mode === "edit" || mode === "view"),
    })

    const activeCertificate = fetchedCertificate || initialCertificate

    const [formData, setFormData] = useState({
        name: "",
        type_id: "",
        status_id: "",
        assigned_to_id: "",
        issued_at: "",
        expires_at: "",
        description: "",
    })

    useEffect(() => {
        if (activeCertificate) {
            setFormData({
                name: activeCertificate.name || "",
                type_id: activeCertificate.typeId?.toString() || (activeCertificate.type?.id?.toString() || ""),
                status_id: activeCertificate.statusId?.toString() || (activeCertificate.status?.id?.toString() || ""),
                assigned_to_id: activeCertificate.assignedToId?.toString() || (activeCertificate.assignedTo?.id?.toString() || ""),
                issued_at: activeCertificate.issuedAt ? activeCertificate.issuedAt.split('T')[0] : "",
                expires_at: activeCertificate.expiresAt ? activeCertificate.expiresAt.split('T')[0] : "",
                description: activeCertificate.description || "",
            })
        } else {
            setFormData({
                name: "",
                type_id: "",
                status_id: "",
                assigned_to_id: "",
                issued_at: DateService.todayInput(),
                expires_at: "",
                description: "",
            })
        }
    }, [activeCertificate, open])

    const mutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const url = isEdit ? `/api/certificates/${activeCertificate.id}` : "/api/certificates"
            const method = isEdit ? "PUT" : "POST"

            // 1. Upload/Get Files (Unified Logic)
            // If Create Mode: Uploads all pending files and returns IDs.
            // If Edit Mode: Returns current IDs (upload happened immediately).
            const fileIds = await attachmentsRef.current?.upload() || []

            // 2. Prepare Payload
            const payload = { ...data, pending_file_ids: fileIds }

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || "Error saving certificate")
            }

            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["certificates"] })
            if (activeCertificate?.id) {
                queryClient.invalidateQueries({ queryKey: ["certificate", activeCertificate.id] })
            }
            toast.success(isEdit ? "Certificado actualizado" : "Certificado creado")
            onClose()
        },
        onError: (error: any) => {
            toast.error(error.message)
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (isView) return
        mutation.mutate(formData)
    }

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isView ? "Detalles del Certificado" : isEdit ? "Editar Certificado" : "Nuevo Certificado"}
                    </DialogTitle>
                    <DialogDescription>
                        {isView ? "Información completa del certificado" : "Complete la información del certificado."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Name */}
                        <div className="md:col-span-1 space-y-2">
                            <Label htmlFor="name">Nombre *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                disabled={isView}
                            />
                        </div>

                        {/* Type */}
                        <div className="space-y-2">
                            <Label>Tipo *</Label>
                            <Select
                                value={formData.type_id}
                                onValueChange={(val) => setFormData({ ...formData, type_id: val })}
                                disabled={isView}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {typeOptions.map((option) => (
                                        <SelectItem key={option.id} value={option.id.toString()}>
                                            {option.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <Label>Estado</Label>
                            <Select
                                value={formData.status_id}
                                onValueChange={(val) => setFormData({ ...formData, status_id: val })}
                                disabled={isView}
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

                        {/* Assigned To */}
                        <div className="space-y-2">
                            <Label>Responsable</Label>
                            <RichSelect
                                value={formData.assigned_to_id}
                                onValueChange={(val) => setFormData({ ...formData, assigned_to_id: val })}
                                options={userOptions.map(u => ({ id: u.id.toString(), name: u.name, image: u.image }))}
                                placeholder="Seleccionar responsable"
                                imageKey="image"
                                disabled={isView}
                            />
                        </div>

                        {/* Issued At */}
                        <div className="space-y-2">
                            <Label htmlFor="issued_at">Fecha Emisión *</Label>
                            <Input
                                id="issued_at"
                                type="date"
                                value={formData.issued_at}
                                onChange={(e) => setFormData({ ...formData, issued_at: e.target.value })}
                                required
                                disabled={isView}
                            />
                        </div>

                        {/* Expires At */}
                        <div className="space-y-2">
                            <Label htmlFor="expires_at">Fecha Vencimiento</Label>
                            <Input
                                id="expires_at"
                                type="date"
                                value={formData.expires_at}
                                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                                disabled={isView}
                            />
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                disabled={isView}
                            />
                        </div>

                        {/* Attachments (Unified) */}
                        <div className="md:col-span-2 space-y-2">
                            <Label className="mb-2 block">Archivos Adjuntos</Label>
                            <ModelAttachments
                                ref={attachmentsRef}
                                areaSlug="certificados"
                                initialFiles={activeCertificate?.files || []}
                                modelId={activeCertificate?.id}
                                modelType="App\Models\Certificate"
                                readOnly={isView}
                                onUpdate={() => {
                                    if (activeCertificate?.id) {
                                        queryClient.invalidateQueries({ queryKey: ["certificate", activeCertificate.id] })
                                        queryClient.invalidateQueries({ queryKey: ["certificates"] })
                                    }
                                }}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            {isView ? "Cerrar" : "Cancelar"}
                        </Button>
                        {!isView && (
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending ? "Guardando..." : "Guardar"}
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
