"use client"

import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RichSelect } from "@/components/ui/rich-select"
import ModelAttachmentsCreator from "@/components/cloud/ModelAttachmentsCreator"
import ModelAttachments from "@/components/cloud/ModelAttachments"
import { AlertTriangle, FileSignature } from "lucide-react"
import { uploadFile } from "@/actions/files"

interface ApprovalFormModalProps {
    open: boolean
    onClose: () => void
    approval?: any | null
    mode?: "create" | "edit"
    priorities: any[]
    users: any[]
}

export default function ApprovalFormModal({
    open,
    onClose,
    approval: initialData,
    mode = "create",
    priorities,
    users
}: ApprovalFormModalProps) {
    const isEdit = mode === "edit"
    const queryClient = useQueryClient()

    const [formData, setFormData] = useState({
        name: "",
        buy: false,
        approvers: [] as string[],
        priority_id: "",
        description: "",
        all_approvers: false,
        files: [] as File[],
        pending_file_ids: [] as number[],
    })

    useEffect(() => {
        if (initialData && isEdit) {
            setFormData({
                name: initialData.name || "",
                buy: initialData.buy === 1,
                approvers: initialData.approvers ? initialData.approvers.map((a: any) => a.userId.toString()) : [],
                priority_id: initialData.priorityId ? initialData.priorityId.toString() : "",
                description: initialData.description || "",
                all_approvers: initialData.allApprovers === 1,
                files: [], // Files handled by ModelAttachments in edit
                pending_file_ids: [],
            })
        } else {
            setFormData({
                name: "",
                buy: false,
                approvers: [],
                priority_id: "",
                description: "",
                all_approvers: false,
                files: [],
                pending_file_ids: [],
            })
        }
    }, [initialData, open, isEdit])

    const mutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const url = isEdit ? `/api/approvals/${initialData.id}` : "/api/approvals"
            const method = isEdit ? "PUT" : "POST"

            // Using JSON for now as ModelAttachmentsCreator usually handles uploads separately 
            // or returns IDs. If files need multipart, adjust here.
            // Based on other modals, we send JSON with pending_file_ids usually, 
            // but let's check if we need FormData for 'files'.
            // The referenced DonationFormModal sends JSON.

            // Handle New Files Upload
            const uploadedFileIds: number[] = []
            if (data.files && data.files.length > 0) {
                for (const file of data.files) {
                    const fd = new FormData()
                    fd.append("file", file)
                    const res = await uploadFile(fd)
                    if (res.success && res.file) {
                        uploadedFileIds.push(res.file.id)
                    } else {
                        toast.error(`Error al subir archivo: ${file.name}`)
                    }
                }
            }

            // Prepare payload
            // Map pending_file_ids (which might be objects from Creator) to IDs if needed
            // The state definition says number[], but the component uses objects.
            // Let's assume they are objects { id, ... } based on ModelAttachmentsCreator usage.
            const pendingIds = Array.isArray(data.pending_file_ids)
                ? data.pending_file_ids.map((f: any) => f.id || f) // Handle object or primitive
                : []

            const payload = {
                ...data,
                files: undefined, // Don't send File objects
                pending_file_ids: [...pendingIds, ...uploadedFileIds]
            }

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || "Error saving approval")
            }

            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["approvals"] })
            toast.success(isEdit ? "Solicitud actualizada" : "Solicitud creada")
            onClose()
        },
        onError: (error: any) => {
            toast.error(error.message)
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (formData.approvers.length === 0) {
            toast.error("Debe seleccionar al menos un aprobador")
            return
        }
        mutation.mutate(formData)
    }

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader className="border-b pb-4 bg-gray-50 -mx-6 -mt-6 px-6 pt-6 rounded-t-lg">
                    <div className="flex items-center gap-3">
                        <div className="bg-yellow-700 text-white rounded p-2">
                            <FileSignature className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle>{isEdit ? "Editar Solicitud" : "Nueva Solicitud de Aprobación"}</DialogTitle>
                            <DialogDescription>
                                {isEdit ? "Modifica los detalles de tu solicitud" : "Crea una nueva solicitud para tu equipo"}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-4">

                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre de la solicitud *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej: Compra de Licencias"
                            required
                        />
                    </div>

                    {/* Buy Checkbox */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="buy"
                            checked={formData.buy}
                            onCheckedChange={(checked) => setFormData({ ...formData, buy: checked === true })}
                        />
                        <Label htmlFor="buy">¿Es un solicitud de compra?</Label>
                    </div>

                    {/* Approvers */}
                    <div className="space-y-2">
                        <Label>Aprobadores *</Label>
                        <RichSelect
                            options={users} // Users list for selection
                            value={formData.approvers}
                            onValueChange={(val) => setFormData({ ...formData, approvers: val ? val.map((v: any) => v.toString()) : [] })}
                            multiple
                            placeholder="Seleccionar aprobadores..."
                            imageKey="image"
                        />
                    </div>

                    {/* All Approvers Checkbox */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="all_approvers"
                            checked={formData.all_approvers}
                            onCheckedChange={(checked) => setFormData({ ...formData, all_approvers: checked === true })}
                        />
                        <Label htmlFor="all_approvers">Solicitar respuesta de TODOS los destinatarios</Label>
                    </div>

                    {/* Priority */}
                    <div className="space-y-2">
                        <Label>Prioridad *</Label>
                        <Select value={formData.priority_id} onValueChange={(val) => setFormData({ ...formData, priority_id: val })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una prioridad" />
                            </SelectTrigger>
                            <SelectContent>
                                {priorities.map((p) => (
                                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Detalles adicionales</Label>
                        <Textarea
                            id="description"
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {/* Files */}
                    <div className="space-y-2">
                        <Label>Adjuntar Archivos</Label>
                        {isEdit ? (
                            <div className="space-y-4">
                                <div className="bg-yellow-50 p-3 rounded-md flex items-center gap-2 text-yellow-700 text-sm">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span>Editar la solicitud reiniciará el proceso de aprobación.</span>
                                </div>
                                <ModelAttachments
                                    modelId={initialData.id}
                                    modelType="App\Models\Approval"
                                    initialFiles={initialData.files || []}
                                    onUpdate={() => queryClient.invalidateQueries({ queryKey: ["approvals"] })}
                                />
                            </div>
                        ) : (
                            <ModelAttachmentsCreator
                                files={formData.files}
                                onFilesChange={(files) => setFormData({ ...formData, files })}
                                pendingCloudFiles={formData.pending_file_ids as any} // Cast as any or fix type in state to match FileModel[]; component emits array of objects usually
                                onPendingCloudFilesChange={(files) => setFormData({ ...formData, pending_file_ids: files as any })}
                            />
                        )}
                    </div>

                    <DialogFooter className="bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                        <Button type="button" variant="outline" onClick={onClose} className="bg-white">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? (isEdit ? "Actualizando..." : "Guardando...") : (isEdit ? "Actualizar Solicitud" : "Crear Solicitud")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
