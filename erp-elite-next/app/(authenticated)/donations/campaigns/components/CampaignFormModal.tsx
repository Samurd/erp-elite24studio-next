"use client"

import { useState, useEffect, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { RichSelect } from "@/components/ui/rich-select"
import MoneyInput from "@/components/ui/money-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateService } from "@/lib/date-service"
// Removed ModelAttachmentsCreator
import ModelAttachments, { ModelAttachmentsRef } from "@/components/cloud/ModelAttachments"

interface CampaignFormModalProps {
    open: boolean
    onClose: () => void
    campaign?: any | null // Initial data from list
    mode?: "create" | "edit"
    statusOptions: any[]
    userOptions: any[]
}

export default function CampaignFormModal({
    open,
    onClose,
    campaign: initialCampaign,
    mode = "create",
    statusOptions,
    userOptions
}: CampaignFormModalProps) {
    const isEdit = mode === "edit"
    const queryClient = useQueryClient()
    const attachmentsRef = useRef<ModelAttachmentsRef>(null)

    // Fetch full campaign details if editing
    const { data: fetchedCampaign, isLoading } = useQuery({
        queryKey: ["campaign", initialCampaign?.id],
        queryFn: async () => {
            if (!initialCampaign?.id) return null
            const res = await fetch(`/api/donations/campaigns/${initialCampaign.id}`)
            if (!res.ok) throw new Error("Failed to fetch campaign")
            return res.json()
        },
        enabled: open && isEdit && !!initialCampaign?.id,
    })

    const activeCampaign = fetchedCampaign || initialCampaign

    const [formData, setFormData] = useState({
        name: "",
        date_event: "",
        address: "",
        responsible_id: "",
        status_id: "",
        goal: "",
        estimated_budget: "",
        alliances: "",
        description: "",
    })

    useEffect(() => {
        if (activeCampaign && isEdit) {
            setFormData({
                name: activeCampaign.name || "",
                date_event: DateService.toInput(activeCampaign.dateEvent),
                address: activeCampaign.address || "",
                responsible_id: activeCampaign.responsibleId?.toString() || "",
                status_id: activeCampaign.statusId?.toString() || "",
                goal: activeCampaign.goal ? activeCampaign.goal.toString() : "",
                estimated_budget: activeCampaign.estimatedBudget ? activeCampaign.estimatedBudget.toString() : "",
                alliances: activeCampaign.alliances || "",
                description: activeCampaign.description || "",
            })
        } else {
            setFormData({
                name: "",
                date_event: "",
                address: "",
                responsible_id: "",
                status_id: "",
                goal: "",
                estimated_budget: "",
                alliances: "",
                description: "",
            })
        }
    }, [activeCampaign, open, isEdit])

    const mutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const url = isEdit ? `/api/donations/campaigns/${activeCampaign.id}` : "/api/donations/campaigns"
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
                throw new Error(error.error || "Error saving campaign")
            }

            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["campaigns"] })
            toast.success(isEdit ? "Campaña actualizada" : "Campaña creada")
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
                    <DialogTitle>{isEdit ? "Editar Campaña" : "Nueva Campaña"}</DialogTitle>
                    <DialogDescription>
                        Complete la información de la campaña de donación.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Name */}
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="name">Nombre de la Campaña *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Nombre de la campaña"
                                required
                            />
                        </div>

                        {/* Date Event */}
                        <div className="space-y-2">
                            <Label htmlFor="date_event">Fecha del Evento</Label>
                            <Input
                                id="date_event"
                                type="date"
                                value={formData.date_event}
                                onChange={(e) => setFormData({ ...formData, date_event: e.target.value })}
                            />
                        </div>

                        {/* Address */}
                        <div className="space-y-2">
                            <Label htmlFor="address">Lugar del Evento</Label>
                            <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Dirección o lugar del evento"
                            />
                        </div>

                        {/* Responsible */}
                        <div className="space-y-2">
                            <Label>Responsable</Label>
                            <RichSelect
                                value={formData.responsible_id}
                                onValueChange={(val) => setFormData({ ...formData, responsible_id: val })}
                                options={userOptions.map(u => ({ id: u.id.toString(), name: u.name, image: u.image }))}
                                placeholder="Seleccionar responsable"
                                imageKey="image"
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

                        {/* Goal */}
                        <div className="space-y-2">
                            <MoneyInput
                                id="goal"
                                label="Meta"
                                value={parseInt(formData.goal) || 0}
                                onChange={(val) => setFormData({ ...formData, goal: val.toString() })}
                                placeholder="$ 0,00"
                            />
                        </div>

                        {/* Estimated Budget */}
                        <div className="space-y-2">
                            <MoneyInput
                                id="estimated_budget"
                                label="Presupuesto Estimado"
                                value={parseInt(formData.estimated_budget) || 0}
                                onChange={(val) => setFormData({ ...formData, estimated_budget: val.toString() })}
                                placeholder="$ 0,00"
                            />
                        </div>

                        {/* Alliances */}
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="alliances">Alianzas</Label>
                            <Textarea
                                id="alliances"
                                value={formData.alliances}
                                onChange={(e) => setFormData({ ...formData, alliances: e.target.value })}
                                rows={3}
                                placeholder="Describa las alianzas involucradas en la campaña..."
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
                                placeholder="Descripción detallada de la campaña..."
                            />
                        </div>

                    </div>

                    {/* Files */}
                    <div className="border-t pt-6 space-y-4">
                        <Label className="text-lg font-medium">Banners y Documentos</Label>
                        <ModelAttachments
                            ref={attachmentsRef}
                            areaSlug="donaciones"
                            initialFiles={activeCampaign?.files || []}
                            modelId={activeCampaign?.id}
                            modelType="App\Models\Campaign"
                            onUpdate={() => {
                                if (activeCampaign?.id) {
                                    queryClient.invalidateQueries({ queryKey: ["campaign", activeCampaign.id] })
                                }
                            }}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? (isEdit ? "Actualizando..." : "Guardando...") : (isEdit ? "Actualizar Campaña" : "Guardar Campaña")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    )
}
