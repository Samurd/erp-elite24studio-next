"use client"

import { useState, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { RichSelect } from "@/components/ui/rich-select"
import MoneyInput from "@/components/ui/money-input"
import ModelAttachmentsCreator from "@/components/cloud/ModelAttachmentsCreator"
import ModelAttachments from "@/components/cloud/ModelAttachments"

interface DonationFormModalProps {
    open: boolean
    onClose: () => void
    donation?: any | null
    mode?: "create" | "edit"
    campaignOptions: any[]
}

export default function DonationFormModal({
    open,
    onClose,
    donation: initialDonation,
    mode = "create",
    campaignOptions
}: DonationFormModalProps) {
    const isEdit = mode === "edit"
    const queryClient = useQueryClient()

    // Fetch full donation details if editing
    const { data: fetchedDonation } = useQuery({
        queryKey: ["donation", initialDonation?.id],
        queryFn: async () => {
            if (!initialDonation?.id) return null
            const res = await fetch(`/api/donations/donations/${initialDonation.id}`)
            if (!res.ok) throw new Error("Failed to fetch donation")
            return res.json()
        },
        enabled: open && isEdit && !!initialDonation?.id,
    })

    const activeDonation = fetchedDonation || initialDonation

    const [formData, setFormData] = useState({
        name: "",
        campaign_id: "",
        amount: "",
        payment_method: "",
        date: "",
        certified: false,
        files: [] as File[],
        pending_file_ids: [] as any[], // For cloud files
    })

    useEffect(() => {
        if (activeDonation && isEdit) {
            setFormData({
                name: activeDonation.name || "",
                campaign_id: activeDonation.campaignId ? activeDonation.campaignId.toString() : "",
                amount: activeDonation.amount ? activeDonation.amount.toString() : "",
                payment_method: activeDonation.paymentMethod || "",
                date: activeDonation.date ? activeDonation.date.split('T')[0] : "",
                certified: activeDonation.certified === 1,
                files: [], // Files not typically pre-loaded in form state for edit, only new ones
                pending_file_ids: [],
            })
        } else {
            setFormData({
                name: "",
                campaign_id: "",
                amount: "",
                payment_method: "",
                date: new Date().toISOString().split('T')[0],
                certified: false,
                files: [],
                pending_file_ids: [],
            })
        }
    }, [activeDonation, open, isEdit])

    const mutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const url = isEdit ? `/api/donations/donations/${activeDonation.id}` : "/api/donations/donations"
            const method = isEdit ? "PUT" : "POST"

            // 1. Upload local files first
            const uploadedFileIds: number[] = []
            if (data.files && data.files.length > 0) {
                const { uploadFile } = await import("@/actions/files")

                for (const file of data.files) {
                    const formData = new FormData()
                    formData.append("file", file)
                    const res = await uploadFile(formData)
                    if (res.success && res.file) {
                        uploadedFileIds.push(res.file.id)
                    } else {
                        console.error("Failed to upload file:", file.name)
                        toast.error(`Error al subir archivo: ${file.name}`)
                    }
                }
            }

            // 2. Combine with existing pending cloud files
            // Handle both object (from Creator) and primitive ID types if mixed
            const pendingIds = data.pending_file_ids.map((f: any) => f.id || f)

            const finalPendingIds = [
                ...pendingIds,
                ...uploadedFileIds
            ]

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    pending_file_ids: finalPendingIds
                }),
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || "Error saving donation")
            }

            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["donations"] })
            toast.success(isEdit ? "Donación actualizada" : "Donación creada")
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
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Editar Donación" : "Nueva Donación"}</DialogTitle>
                    <DialogDescription>
                        Ingrese los detalles de la donación recibida.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Name */}
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="name">Nombre del Donante *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ingrese el nombre del donante o entidad"
                                required
                            />
                        </div>

                        {/* Campaign */}
                        <div className="space-y-2">
                            <Label>Campaña</Label>
                            <RichSelect
                                value={formData.campaign_id}
                                onValueChange={(val) => setFormData({ ...formData, campaign_id: val })}
                                options={campaignOptions.map(c => ({ id: c.id.toString(), name: c.name }))}
                                placeholder="Seleccionar campaña"
                            />
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <MoneyInput
                                id="amount"
                                label="Monto"
                                value={parseInt(formData.amount) || 0}
                                onChange={(val) => setFormData({ ...formData, amount: val.toString() })}
                                placeholder="$ 0,00"
                            />
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-2">
                            <Label htmlFor="payment_method">Método de Pago *</Label>
                            <Input
                                id="payment_method"
                                value={formData.payment_method}
                                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                                placeholder="Ej: Transferencia, Efectivo, Tarjeta"
                                required
                            />
                        </div>

                        {/* Date */}
                        <div className="space-y-2">
                            <Label htmlFor="date">Fecha de Donación *</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>

                        {/* Certified */}
                        <div className="md:col-span-2 space-y-2 flex items-center gap-2">
                            <Checkbox
                                id="certified"
                                checked={formData.certified}
                                onCheckedChange={(checked) => setFormData({ ...formData, certified: checked === true })}
                            />
                            <Label htmlFor="certified" className="cursor-pointer">Certificado</Label>
                        </div>

                    </div>

                    {/* Files */}
                    <div className="border-t pt-6 space-y-4">
                        {!isEdit ? (
                            <ModelAttachmentsCreator
                                files={formData.files}
                                onFilesChange={(files) => setFormData({ ...formData, files })}
                                pendingCloudFiles={formData.pending_file_ids}
                                onPendingCloudFilesChange={(files) => setFormData({ ...formData, pending_file_ids: files })}
                            />
                        ) : (
                            activeDonation?.id && (
                                <ModelAttachments
                                    initialFiles={activeDonation.files || []}
                                    modelId={activeDonation.id}
                                    modelType="App\Models\Donation"

                                    onUpdate={() => queryClient.invalidateQueries({ queryKey: ["donation", activeDonation.id] })}
                                />
                            )
                        )}
                        {/* Note: ModelAttachments for Edit likely needs the component to support fetching. 
                            If not, we might need to fetch files in parent and pass them. 
                            The reference vue used ModelAttachments with model-id.
                        */}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? (isEdit ? "Actualizando..." : "Guardando...") : (isEdit ? "Actualizar Donación" : "Guardar Donación")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
