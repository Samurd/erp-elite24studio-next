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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// Removed ModelAttachmentsCreator
import ModelAttachments, { ModelAttachmentsRef } from "@/components/cloud/ModelAttachments"

interface VolunteerFormModalProps {
    open: boolean
    onClose: () => void
    volunteer?: any | null
    mode?: "create" | "edit"
    campaignOptions: any[]
    statusOptions: any[]
}

export default function VolunteerFormModal({
    open,
    onClose,
    volunteer: initialVolunteer,
    mode = "create",
    campaignOptions,
    statusOptions
}: VolunteerFormModalProps) {
    const isEdit = mode === "edit"
    const queryClient = useQueryClient()
    const attachmentsRef = useRef<ModelAttachmentsRef>(null)

    // Fetch full volunteer details if editing
    const { data: fetchedVolunteer } = useQuery({
        queryKey: ["volunteer", initialVolunteer?.id],
        queryFn: async () => {
            if (!initialVolunteer?.id) return null
            const res = await fetch(`/api/donations/volunteers/${initialVolunteer.id}`)
            if (!res.ok) throw new Error("Failed to fetch volunteer")
            return res.json()
        },
        enabled: open && isEdit && !!initialVolunteer?.id,
    })

    const activeVolunteer = fetchedVolunteer || initialVolunteer

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        country: "",
        role: "",
        campaign_id: "",
        status_id: "",
        certified: false,
    })

    useEffect(() => {
        if (activeVolunteer && isEdit) {
            setFormData({
                name: activeVolunteer.name || "",
                email: activeVolunteer.email || "",
                phone: activeVolunteer.phone || "",
                address: activeVolunteer.address || "",
                city: activeVolunteer.city || "",
                state: activeVolunteer.state || "",
                country: activeVolunteer.country || "",
                role: activeVolunteer.role || "",
                campaign_id: activeVolunteer.campaignId ? activeVolunteer.campaignId.toString() : "",
                status_id: activeVolunteer.statusId ? activeVolunteer.statusId.toString() : "",
                certified: activeVolunteer.certified === 1,
            })
        } else {
            setFormData({
                name: "",
                email: "",
                phone: "",
                address: "",
                city: "",
                state: "",
                country: "",
                role: "",
                campaign_id: "",
                status_id: "",
                certified: false,
            })
        }
    }, [activeVolunteer, open, isEdit])

    const mutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const url = isEdit ? `/api/donations/volunteers/${activeVolunteer.id}` : "/api/donations/volunteers"
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
                throw new Error(error.error || "Error saving volunteer")
            }

            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["volunteers"] })
            toast.success(isEdit ? "Voluntario actualizado" : "Voluntario creado")
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
                    <DialogTitle>{isEdit ? "Editar Voluntario" : "Nuevo Voluntario"}</DialogTitle>
                    <DialogDescription>
                        Ingrese la información personal y detalles del voluntariado.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Personal Info */}
                    <div>
                        <h3 className="text-lg font-medium mb-4 pb-2 border-b">Información Personal</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="name">Nombre Completo *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Teléfono</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <h3 className="text-lg font-medium mb-4 pb-2 border-b">Ubicación</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="address">Dirección</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">Ciudad</Label>
                                <Input
                                    id="city"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state">Estado / Departamento</Label>
                                <Input
                                    id="state"
                                    value={formData.state}
                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country">País</Label>
                                <Input
                                    id="country"
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Details */}
                    <div>
                        <h3 className="text-lg font-medium mb-4 pb-2 border-b">Detalles del Voluntariado</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Campaña Asignada</Label>
                                <RichSelect
                                    value={formData.campaign_id}
                                    onValueChange={(val) => setFormData({ ...formData, campaign_id: val })}
                                    options={campaignOptions.map(c => ({ id: c.id.toString(), name: c.name }))}
                                    placeholder="Ninguna campaña específica"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Estado</Label>
                                <Select value={formData.status_id} onValueChange={(val) => setFormData({ ...formData, status_id: val })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statusOptions.map((s: any) => (
                                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Rol / Cargo</Label>
                                <Input
                                    id="role"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    placeholder="Ej: Logística"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2 flex items-center gap-2 pt-4">
                                <Checkbox
                                    id="certified"
                                    checked={formData.certified}
                                    onCheckedChange={(checked) => setFormData({ ...formData, certified: checked === true })}
                                />
                                <Label htmlFor="certified" className="cursor-pointer">Certificado Entregado</Label>
                            </div>
                        </div>
                    </div>

                    {/* Files */}
                    <div className="border-t pt-6 space-y-4">
                        <Label className="text-lg font-medium">Archivos y Documentos</Label>
                        <ModelAttachments
                            ref={attachmentsRef}
                            areaSlug="donaciones"
                            initialFiles={activeVolunteer?.files || []}
                            modelId={activeVolunteer?.id}
                            modelType="App\Models\Volunteer"
                            onUpdate={() => {
                                if (activeVolunteer?.id) {
                                    queryClient.invalidateQueries({ queryKey: ["volunteer", activeVolunteer.id] })
                                }
                            }}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? (isEdit ? "Actualizando..." : "Guardando...") : (isEdit ? "Actualizar Voluntario" : "Guardar Voluntario")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
