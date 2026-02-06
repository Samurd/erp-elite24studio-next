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
import { ExternalLink, FileIcon } from "lucide-react"
import { DateService } from "@/lib/date-service"

interface LicenseFormModalProps {
    open: boolean
    onClose: () => void
    license?: any | null
    mode?: "create" | "edit" | "view"
    typeOptions: any[]
    statusOptions: any[]
    projectOptions: any[]
}

export default function LicenseFormModal({
    open,
    onClose,
    license: initialLicense,
    mode = "create",
    typeOptions,
    statusOptions,
    projectOptions = []
}: LicenseFormModalProps) {
    const isView = mode === "view"
    const isEdit = mode === "edit" || mode === "view"

    const queryClient = useQueryClient()
    const attachmentsRef = useRef<ModelAttachmentsRef>(null)

    // Fetch full license details including files
    const { data: fetchedLicense, isLoading } = useQuery({
        queryKey: ["license", initialLicense?.id],
        queryFn: async () => {
            if (!initialLicense?.id) return null
            const res = await fetch(`/api/licenses/${initialLicense.id}`)
            if (!res.ok) throw new Error("Failed to fetch license")
            return res.json()
        },
        enabled: open && !!initialLicense?.id && (mode === "edit" || mode === "view"),
    })

    const activeLicense = fetchedLicense || initialLicense

    const [formData, setFormData] = useState({
        project_id: "",
        license_type_id: "",
        status_id: "",
        entity: "",
        company: "",
        eradicated_number: "",
        eradicatd_date: "",
        estimated_approval_date: "",
        expiration_date: "",
        requires_extension: false,
        observations: "",
    })

    useEffect(() => {
        if (activeLicense) {
            setFormData({
                project_id: activeLicense.projectId?.toString() || (activeLicense.project?.id?.toString() || ""),
                license_type_id: activeLicense.licenseTypeId?.toString() || (activeLicense.licenseType?.id?.toString() || ""),
                status_id: activeLicense.statusId?.toString() || (activeLicense.status?.id?.toString() || ""),
                entity: activeLicense.entity || "",
                company: activeLicense.company || "",
                eradicated_number: activeLicense.eradicatedNumber || "",
                eradicatd_date: activeLicense.eradicatdDate ? activeLicense.eradicatdDate.split('T')[0] : "",
                estimated_approval_date: activeLicense.estimatedApprovalDate ? activeLicense.estimatedApprovalDate.split('T')[0] : "",
                expiration_date: activeLicense.expirationDate ? activeLicense.expirationDate.split('T')[0] : "",
                requires_extension: activeLicense.requiresExtension === 1,
                observations: activeLicense.observations || "",
            })
        } else {
            setFormData({
                project_id: "",
                license_type_id: "",
                status_id: "",
                entity: "",
                company: "",
                eradicated_number: "",
                eradicatd_date: DateService.todayInput(),
                estimated_approval_date: "",
                expiration_date: "",
                requires_extension: false,
                observations: "",
            })
        }
    }, [activeLicense, open])

    const mutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const url = isEdit ? `/api/licenses/${activeLicense.id}` : "/api/licenses"
            const method = isEdit ? "PUT" : "POST"

            // 1. Upload/Get Files
            const fileIds = await attachmentsRef.current?.upload() || []

            // 2. Prepare payload
            const payload = { ...data, pending_file_ids: fileIds }

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || "Error saving license")
            }

            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["licenses"] })
            if (activeLicense?.id) {
                queryClient.invalidateQueries({ queryKey: ["license", activeLicense.id] })
            }
            toast.success(isEdit ? "Licencia actualizada" : "Licencia creada")
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
                        {isView ? "Detalles de Licencia" : isEdit ? "Editar Licencia" : "Nueva Licencia"}
                    </DialogTitle>
                    <DialogDescription>
                        {isView ? "Información completa de la licencia" : "Complete la información de la licencia."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Project */}
                        <div className="space-y-2">
                            <Label>Proyecto *</Label>
                            <Select
                                value={formData.project_id}
                                onValueChange={(val) => setFormData({ ...formData, project_id: val })}
                                disabled={isView}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar proyecto" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projectOptions.map((option) => (
                                        <SelectItem key={option.id} value={option.id.toString()}>
                                            {option.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* License Type */}
                        <div className="space-y-2">
                            <Label>Tipo de Trámite *</Label>
                            <Select
                                value={formData.license_type_id}
                                onValueChange={(val) => setFormData({ ...formData, license_type_id: val })}
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

                        {/* Entity */}
                        <div className="space-y-2">
                            <Label htmlFor="entity">Entidad Tramitadora</Label>
                            <Input
                                id="entity"
                                value={formData.entity}
                                onChange={(e) => setFormData({ ...formData, entity: e.target.value })}
                                disabled={isView}
                                placeholder="Nombre de entidad"
                            />
                        </div>

                        {/* Company */}
                        <div className="space-y-2">
                            <Label htmlFor="company">Empresa Gestora</Label>
                            <Input
                                id="company"
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                disabled={isView}
                                placeholder="Nombre de empresa"
                            />
                        </div>

                        {/* Eradicated Number */}
                        <div className="space-y-2">
                            <Label htmlFor="eradicated_number">Número de Erradicado</Label>
                            <Input
                                id="eradicated_number"
                                value={formData.eradicated_number}
                                onChange={(e) => setFormData({ ...formData, eradicated_number: e.target.value })}
                                disabled={isView}
                                placeholder="Número..."
                            />
                        </div>

                        {/* Dates Row */}
                        <div className="space-y-2">
                            <Label htmlFor="eradicatd_date">Fecha Erradicado</Label>
                            <Input
                                id="eradicatd_date"
                                type="date"
                                value={formData.eradicatd_date}
                                onChange={(e) => setFormData({ ...formData, eradicatd_date: e.target.value })}
                                disabled={isView}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="estimated_approval_date">Fecha Est. Aprobación</Label>
                            <Input
                                id="estimated_approval_date"
                                type="date"
                                value={formData.estimated_approval_date}
                                onChange={(e) => setFormData({ ...formData, estimated_approval_date: e.target.value })}
                                disabled={isView}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="expiration_date">Fecha de Vencimiento</Label>
                            <Input
                                id="expiration_date"
                                type="date"
                                value={formData.expiration_date}
                                onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                                disabled={isView}
                            />
                        </div>

                        {/* Extension Toggle */}
                        <div className="space-y-2">
                            <Label>¿Necesita Prórroga?</Label>
                            <div className="flex items-center space-x-4 mt-2">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        checked={formData.requires_extension === true}
                                        onChange={() => setFormData({ ...formData, requires_extension: true })}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                        disabled={isView}
                                    />
                                    <span className="text-sm">Sí</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        checked={formData.requires_extension === false}
                                        onChange={() => setFormData({ ...formData, requires_extension: false })}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                        disabled={isView}
                                    />
                                    <span className="text-sm">No</span>
                                </label>
                            </div>
                        </div>

                        {/* Observations */}
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="observations">Observaciones</Label>
                            <Textarea
                                id="observations"
                                value={formData.observations}
                                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                                rows={4}
                                disabled={isView}
                            />
                        </div>

                        {/* Attachments (Unified) */}
                        <div className="md:col-span-2 space-y-2">
                            <Label className="mb-2 block">Archivos Adjuntos</Label>
                            <ModelAttachments
                                ref={attachmentsRef}
                                areaSlug="licencias"
                                initialFiles={activeLicense?.files || []}
                                modelId={activeLicense?.id}
                                modelType="App\Models\License"
                                readOnly={isView}
                                onUpdate={() => {
                                    if (activeLicense?.id) {
                                        queryClient.invalidateQueries({ queryKey: ["license", activeLicense.id] })
                                        queryClient.invalidateQueries({ queryKey: ["licenses"] })
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
