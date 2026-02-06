"use client"

import { useState, useEffect, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { RichSelect } from "@/components/ui/rich-select"
import MoneyInput from "@/components/ui/money-input"
// Removed ModelAttachmentsCreator
import ModelAttachments, { ModelAttachmentsRef } from "@/components/cloud/ModelAttachments"

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
    const attachmentsRef = useRef<ModelAttachmentsRef>(null)

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
            })
        } else {
            setFormData({
                name: "",
                campaign_id: "",
                amount: "",
                payment_method: "",
                date: new Date().toISOString().split('T')[0],
                certified: false,
            })
        }
    }, [activeDonation, open, isEdit])

    const mutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const url = isEdit ? `/api/donations/donations/${activeDonation.id}` : "/api/donations/donations"
            const method = isEdit ? "PUT" : "POST"

            // Upload files via ref
            const uploadedFileIds = await attachmentsRef.current?.upload() || []

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    pending_file_ids: uploadedFileIds
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
                        <Label className="text-lg font-medium">Archivos y Comprobantes</Label>
                        <ModelAttachments
                            ref={attachmentsRef}
                            areaSlug="donaciones"
                            initialFiles={activeDonation?.files || []}
                            modelId={activeDonation?.id}
                            modelType="App\Models\Donation"
                            onUpdate={() => {
                                if (activeDonation?.id) {
                                    queryClient.invalidateQueries({ queryKey: ["donation", activeDonation.id] })
                                }
                            }}
                        />
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
