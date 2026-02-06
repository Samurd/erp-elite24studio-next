"use client"

import { useState, useEffect, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RichSelect } from "@/components/ui/rich-select"
// Removed ModelAttachmentsCreator
import ModelAttachments, { ModelAttachmentsRef } from "@/components/cloud/ModelAttachments"
import { AlertTriangle, FileSignature } from "lucide-react"

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
    const attachmentsRef = useRef<ModelAttachmentsRef>(null)

    const [formData, setFormData] = useState({
        name: "",
        buy: false,
        approvers: [] as string[],
        priority_id: "",
        description: "",
        all_approvers: false,
    })

    // Fetch full approval details including files
    const { data: fetchedApproval, isLoading } = useQuery({
        queryKey: ["approval", initialData?.id],
        queryFn: async () => {
            if (!initialData?.id) return null
            const res = await fetch(`/api/approvals/${initialData.id}`)
            if (!res.ok) throw new Error("Failed to fetch approval")
            return res.json()
        },
        enabled: open && !!initialData?.id && isEdit,
    })

    const activeApproval = fetchedApproval || initialData

    useEffect(() => {
        if (activeApproval && isEdit) {
            setFormData({
                name: activeApproval.name || "",
                buy: activeApproval.buy === 1,
                approvers: activeApproval.approvers ? activeApproval.approvers.map((a: any) => a.userId.toString()) : [],
                priority_id: activeApproval.priorityId ? activeApproval.priorityId.toString() : "",
                description: activeApproval.description || "",
                all_approvers: activeApproval.allApprovers === 1,
            })
        } else {
            setFormData({
                name: "",
                buy: false,
                approvers: [],
                priority_id: "",
                description: "",
                all_approvers: false,
            })
        }
    }, [activeApproval, open, isEdit])

    const mutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const url = isEdit ? `/api/approvals/${activeApproval.id}` : "/api/approvals"
            const method = isEdit ? "PUT" : "POST"

            // Upload files via ref
            const uploadedFileIds = await attachmentsRef.current?.upload() || []

            const payload = {
                ...data,
                pending_file_ids: uploadedFileIds
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
            if (activeApproval?.id) {
                queryClient.invalidateQueries({ queryKey: ["approval", activeApproval.id] })
            }
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
                        {isEdit && (
                            <div className="bg-yellow-50 p-3 rounded-md flex items-center gap-2 text-yellow-700 text-sm mb-4">
                                <AlertTriangle className="h-4 w-4" />
                                <span>Editar la solicitud reiniciará el proceso de aprobación.</span>
                            </div>
                        )}
                        <ModelAttachments
                            ref={attachmentsRef}
                            areaSlug="aprobaciones"
                            modelId={activeApproval?.id}
                            modelType="App\Models\Approval"
                            initialFiles={activeApproval?.files || []}
                            onUpdate={() => {
                                if (activeApproval?.id) {
                                    queryClient.invalidateQueries({ queryKey: ["approval", activeApproval.id] })
                                    queryClient.invalidateQueries({ queryKey: ["approvals"] })
                                }
                            }}
                        />
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
