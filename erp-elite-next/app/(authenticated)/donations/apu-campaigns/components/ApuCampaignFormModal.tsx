"use client"

import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RichSelect } from "@/components/ui/rich-select"
import MoneyInput from "@/components/ui/money-input"
import MoneyDisplay from "@/components/ui/money-display"

interface ApuCampaignFormModalProps {
    open: boolean
    onClose: () => void
    apuCampaign?: any | null
    mode?: "create" | "edit"
    campaigns: any[]
    unitOptions: any[]
}

export default function ApuCampaignFormModal({
    open,
    onClose,
    apuCampaign: initialApuData,
    mode = "create",
    campaigns,
    unitOptions
}: ApuCampaignFormModalProps) {
    const isEdit = mode === "edit"
    const queryClient = useQueryClient()

    const [formData, setFormData] = useState({
        campaign_id: "",
        description: "",
        quantity: "",
        unit_id: "",
        unit_price: 0,
    })

    useEffect(() => {
        if (initialApuData && isEdit) {
            setFormData({
                campaign_id: initialApuData.campaignId ? initialApuData.campaignId.toString() : "",
                description: initialApuData.description || "",
                quantity: initialApuData.quantity ? initialApuData.quantity.toString() : "",
                unit_id: initialApuData.unitId ? initialApuData.unitId.toString() : "",
                unit_price: initialApuData.unitPrice || 0,
            })
        } else {
            setFormData({
                campaign_id: "",
                description: "",
                quantity: "",
                unit_id: "",
                unit_price: 0,
            })
        }
    }, [initialApuData, open, isEdit])

    const mutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const url = isEdit ? `/api/donations/apu-campaigns/${initialApuData.id}` : "/api/donations/apu-campaigns"
            const method = isEdit ? "PUT" : "POST"

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || "Error saving APU campaign")
            }

            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["apu-campaigns"] })
            toast.success(isEdit ? "Registro actualizado" : "Registro creado")
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

    const calculatedTotal = (parseInt(formData.quantity || "0") * formData.unit_price)

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Editar APU" : "Nuevo APU"}</DialogTitle>
                    <DialogDescription>
                        Ingrese la información del análisis de precio unitario por campaña.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="grid grid-cols-1 gap-6">

                        {/* Campaign */}
                        <div className="space-y-2">
                            <Label>Campaña *</Label>
                            <Select value={formData.campaign_id} onValueChange={(val) => setFormData({ ...formData, campaign_id: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar campaña" />
                                </SelectTrigger>
                                <SelectContent>
                                    {campaigns.map((c: any) => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción *</Label>
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                                placeholder="Descripción del item"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Quantity */}
                            <div className="space-y-2">
                                <Label htmlFor="quantity">Cantidad *</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min="1"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Unit */}
                            <div className="space-y-2">
                                <Label>Unidad</Label>
                                <RichSelect
                                    value={formData.unit_id ? parseInt(formData.unit_id) : undefined}
                                    onValueChange={(val) => setFormData({ ...formData, unit_id: val ? val.toString() : "" })}
                                    options={unitOptions}
                                    placeholder="Seleccionar unidad"
                                    showAvatar={false}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Unit Price */}
                            <div className="space-y-2">
                                <Label>Valor Unitario *</Label>
                                <MoneyInput
                                    value={formData.unit_price}
                                    onChange={(val) => setFormData({ ...formData, unit_price: val })}
                                />
                            </div>

                            {/* Calculated Total */}
                            <div className="space-y-2">
                                <Label>Total Calculado</Label>
                                <div className="p-2 bg-gray-100 rounded-md font-bold text-right border border-gray-200">
                                    <MoneyDisplay value={calculatedTotal} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? (isEdit ? "Actualizando..." : "Guardando...") : (isEdit ? "Actualizar APU" : "Guardar APU")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
