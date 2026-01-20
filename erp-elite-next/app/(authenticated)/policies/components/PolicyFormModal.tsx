"use client"

import { useState, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import ModelAttachmentsCreator from "@/components/cloud/ModelAttachmentsCreator"
import ModelAttachments from "@/components/cloud/ModelAttachments"
import { FileIcon, ExternalLink } from "lucide-react"
import { RichSelect } from "@/components/ui/rich-select"
import { DateService } from "@/lib/date-service"

interface PolicyFormModalProps {
    open: boolean
    onClose: () => void
    policy?: any | null
    mode?: "create" | "edit" | "view"
    typeOptions: any[]
    statusOptions: any[]
    userOptions: any[]
}

export default function PolicyFormModal({
    open,
    onClose,
    policy: initialPolicy,
    mode = "create",
    typeOptions,
    statusOptions,
    userOptions
}: PolicyFormModalProps) {
    const isView = mode === "view"
    const isEdit = mode === "edit" || mode === "view" // View mode also needs to fetch

    const queryClient = useQueryClient()

    // Fetch full policy details including files
    const { data: fetchedPolicy, isLoading } = useQuery({
        queryKey: ["policy", initialPolicy?.id],
        queryFn: async () => {
            if (!initialPolicy?.id) return null
            const res = await fetch(`/api/policies/${initialPolicy.id}`)
            if (!res.ok) throw new Error("Failed to fetch policy")
            return res.json()
        },
        enabled: open && !!initialPolicy?.id && (mode === "edit" || mode === "view"),
    })

    const activePolicy = fetchedPolicy || initialPolicy

    const [formData, setFormData] = useState({
        name: "",
        type_id: "",
        status_id: "",
        assigned_to_id: "",
        issued_at: "",
        reviewed_at: "",
        description: "",
        // content: "", // Not in schema, skipping
    })

    const [files, setFiles] = useState<File[]>([])
    const [pendingCloudFiles, setPendingCloudFiles] = useState<any[]>([])

    useEffect(() => {
        if (activePolicy) {
            setFormData({
                name: activePolicy.name || "",
                type_id: activePolicy.typeId?.toString() || "",
                status_id: activePolicy.statusId?.toString() || "",
                assigned_to_id: activePolicy.assignedToId?.toString() || "",
                issued_at: activePolicy.issuedAt ? new Date(activePolicy.issuedAt).toISOString().split('T')[0] : "", // Still using split T for input value if it's YYYY-MM-DD
                // Actually DateService might not have a helper for "YYYY-MM-DD" conversion from DB string if it's already YYYY-MM-DD?
                // The DB returns string for date mode.
                // Let's stick to split('T')[0] if it works or use a helper if DateService has one for input.
                // DateService.todayInput() gives YYYY-MM-DD.
                reviewed_at: activePolicy.reviewedAt ? new Date(activePolicy.reviewedAt).toISOString().split('T')[0] : "",
                description: activePolicy.description || "",
            })
        } else {
            setFormData({
                name: "",
                type_id: "",
                status_id: "",
                assigned_to_id: "",
                issued_at: DateService.todayInput(),
                reviewed_at: "",
                description: "",
            })
        }
    }, [activePolicy, open])

    useEffect(() => {
        if (!open) {
            setFiles([])
            setPendingCloudFiles([])
        }
    }, [open])

    const mutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const url = isEdit ? `/api/policies/${activePolicy.id}` : "/api/policies"
            const method = isEdit ? "PUT" : "POST"

            const uploadedFileIds = []
            const { uploadFile } = await import("@/actions/files") // Dynamic import

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
                throw new Error(error.error || "Error saving policy")
            }

            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["policies"] })
            if (activePolicy?.id) {
                queryClient.invalidateQueries({ queryKey: ["policy", activePolicy.id] })
            }
            toast.success(isEdit ? "Política actualizada" : "Política creada")
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
                        {isView ? "Detalles de Política" : isEdit ? "Editar Política" : "Nueva Política"}
                    </DialogTitle>
                    <DialogDescription>
                        {isView ? "Información completa de la política" : "Complete la información de la política."}
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
                            {/* Label handled inside RichSelect or we can keep it here but RichSelect usually has its own or we pass placeholder.
                                Warning: RichSelect might not have a label prop based on previous usage in other modals (e.g. CaseRecordFormModal).
                                Let's check RichSelect usage. It usually takes placeholder.
                                We will keep the Label component above it if RichSelect doesn't render one, or remove it if RichSelect handles it?
                                Previous usage in user prompt: <InputLabel ... /> <RichSelect ... />
                                I'll keep the div wrapper.
                             */}
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

                        {/* Reviewed At */}
                        <div className="space-y-2">
                            <Label htmlFor="reviewed_at">Última Revisión</Label>
                            <Input
                                id="reviewed_at"
                                type="date"
                                value={formData.reviewed_at}
                                onChange={(e) => setFormData({ ...formData, reviewed_at: e.target.value })}
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

                        {/* Attachments */}
                        <div className="md:col-span-2 space-y-2">
                            <Label className="mb-2 block">Archivos Adjuntos</Label>
                            {isView ? (
                                <div className="bg-gray-50 rounded-lg p-4 border border-dashed text-sm">
                                    {activePolicy && activePolicy.files && activePolicy.files.length > 0 ? (
                                        <div className="space-y-2">
                                            {activePolicy.files.map((file: any) => (
                                                <div key={file.id} className="flex items-center justify-between p-2 bg-white rounded shadow-sm">
                                                    <div className="flex items-center space-x-2 truncate">
                                                        <FileIcon className="w-4 h-4 text-gray-500" />
                                                        <span className="truncate">{file.name}</span>
                                                    </div>
                                                    <a
                                                        href={file.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 italic">No hay archivos adjuntos.</span>
                                    )}
                                </div>
                            ) : isEdit ? (
                                activePolicy && (
                                    <ModelAttachments
                                        initialFiles={activePolicy.files || []}
                                        modelId={activePolicy.id}
                                        modelType="App\Models\Policy"
                                        onUpdate={() => {
                                            queryClient.invalidateQueries({ queryKey: ["policy", activePolicy.id] })
                                            queryClient.invalidateQueries({ queryKey: ["policies"] })
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
