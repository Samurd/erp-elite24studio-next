"use client"

import { useState, useEffect, useRef } from "react"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
// Removed ModelAttachmentsCreator import
import ModelAttachments, { ModelAttachmentsRef } from "@/components/cloud/ModelAttachments"
import MoneyInput from "@/components/ui/money-input"

interface SubscriptionFormModalProps {
    open: boolean
    onClose: () => void
    subscription?: any | null
    statusOptions: any[]
    frequencyOptions: any[]
}

export default function SubscriptionFormModal({ open, onClose, subscription, statusOptions, frequencyOptions }: SubscriptionFormModalProps) {
    const isEdit = !!subscription
    const queryClient = useQueryClient()
    const attachmentsRef = useRef<ModelAttachmentsRef>(null)

    const [formData, setFormData] = useState({
        name: "",
        frequency_id: "",
        type: "",
        amount: "",
        status_id: "",
        start_date: "",
        renewal_date: "",
        notes: "",
    })

    // Removed files and pendingCloudFiles state as they are handled by ModelAttachments

    // Fetch full details including files when in edit mode
    const { data: subDetails } = useQuery({
        queryKey: ["subscription", subscription?.id],
        queryFn: async () => {
            if (!subscription?.id) return null
            const res = await fetch(`/api/subscriptions/${subscription.id}`)
            if (!res.ok) throw new Error("Failed to fetch subscription details")
            return res.json()
        },
        enabled: !!subscription?.id && open
    })

    const effectiveSubscription = subDetails || subscription

    useEffect(() => {
        if (effectiveSubscription) {
            setFormData({
                name: effectiveSubscription.name || "",
                frequency_id: effectiveSubscription.frequencyId?.toString() || "",
                type: effectiveSubscription.type || "",
                amount: effectiveSubscription.amount?.toString() || "",
                status_id: effectiveSubscription.statusId?.toString() || "",
                start_date: effectiveSubscription.startDate ? effectiveSubscription.startDate.split('T')[0] : "",
                renewal_date: effectiveSubscription.renewalDate ? effectiveSubscription.renewalDate.split('T')[0] : "",
                notes: effectiveSubscription.notes || "",
            })
        } else {
            setFormData({
                name: "",
                frequency_id: "",
                type: "",
                amount: "",
                status_id: "",
                start_date: new Date().toISOString().split('T')[0],
                renewal_date: "",
                notes: "",
            })
        }
    }, [effectiveSubscription, open])

    // Removed useEffect for resetting files state

    const mutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const url = isEdit ? `/api/subscriptions/${subscription.id}` : "/api/subscriptions"
            const method = isEdit ? "PUT" : "POST"

            // Upload files via ref
            const uploadedFileIds = await attachmentsRef.current?.upload() || []

            const payload = { ...data, pending_file_ids: uploadedFileIds }

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || "Error saving subscription")
            }

            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subscriptions"] })
            toast.success(isEdit ? "Suscripción actualizada" : "Suscripción creada")
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
                    <DialogTitle>{isEdit ? "Editar Suscripción" : "Nueva Suscripción"}</DialogTitle>
                    <DialogDescription>
                        Complete la información de la suscripción.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name */}
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="name">Nombre *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        {/* Frequency */}
                        <div className="space-y-2">
                            <Label>Frecuencia *</Label>
                            <Select
                                value={formData.frequency_id}
                                onValueChange={(val) => setFormData({ ...formData, frequency_id: val })}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar frecuencia" />
                                </SelectTrigger>
                                <SelectContent>
                                    {frequencyOptions.map((option) => (
                                        <SelectItem key={option.id} value={option.id.toString()}>
                                            {option.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Type */}
                        <div className="space-y-2">
                            <Label htmlFor="type">Tipo *</Label>
                            <Input
                                id="type"
                                placeholder="Ej: Software, Servicio..."
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                required
                            />
                        </div>

                        {/* Amount - using MoneyInput */}
                        <div className="space-y-2">
                            {/* Label is handled inside MoneyInput now, but grid layout might expect div wrapper */}
                            <MoneyInput
                                id="amount"
                                label="Monto *"
                                value={parseInt(formData.amount || "0")}
                                onChange={(val) => setFormData({ ...formData, amount: val.toString() })}
                                error={undefined} // Add error handling if validated
                            />
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <Label>Estado *</Label>
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

                        {/* Start Date */}
                        <div className="space-y-2">
                            <Label htmlFor="start_date">Fecha Inicio *</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                required
                            />
                        </div>

                        {/* Renewal Date */}
                        <div className="space-y-2">
                            <Label htmlFor="renewal_date">Fecha Renovación *</Label>
                            <Input
                                id="renewal_date"
                                type="date"
                                value={formData.renewal_date}
                                onChange={(e) => setFormData({ ...formData, renewal_date: e.target.value })}
                                required
                            />
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
                            <ModelAttachments
                                ref={attachmentsRef}
                                areaSlug="suscripciones"
                                initialFiles={effectiveSubscription?.files || []}
                                modelId={effectiveSubscription?.id}
                                modelType="App\Models\Sub"
                                onUpdate={() => {
                                    if (effectiveSubscription?.id) {
                                        queryClient.invalidateQueries({ queryKey: ["subscription", effectiveSubscription.id] })
                                    }
                                    queryClient.invalidateQueries({ queryKey: ["subscriptions"] })
                                }}
                            />
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
