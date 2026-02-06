"use client"

import { DateService } from "@/lib/date-service"

import { useState, useEffect, useRef } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// Removed ModelAttachmentsCreator
import ModelAttachments, { ModelAttachmentsRef } from "@/components/cloud/ModelAttachments"
import { useQuery } from "@tanstack/react-query"

interface AllianceFormModalProps {
    open: boolean
    onClose: () => void
    alliance?: any | null
    mode?: "create" | "edit"
    typeOptions: any[]
}

export default function AllianceFormModal({
    open,
    onClose,
    alliance: initialAlliance,
    mode = "create",
    typeOptions
}: AllianceFormModalProps) {
    const isEdit = mode === "edit"
    const queryClient = useQueryClient()
    const attachmentsRef = useRef<ModelAttachmentsRef>(null)

    const { data: fetchedAlliance } = useQuery({
        queryKey: ["alliance", initialAlliance?.id],
        queryFn: async () => {
            const res = await fetch(`/api/donations/alliances/${initialAlliance.id}`)
            if (!res.ok) throw new Error("Failed to fetch alliance")
            return res.json()
        },
        enabled: !!initialAlliance?.id && isEdit,
        initialData: initialAlliance
    })

    const activeAlliance = fetchedAlliance || initialAlliance

    const [formData, setFormData] = useState({
        name: "",
        type_id: "",
        start_date: DateService.todayInput(),
        validity: "",
        certified: false,
    })

    useEffect(() => {
        if (activeAlliance && isEdit) {
            setFormData({
                name: activeAlliance.name || "",
                type_id: activeAlliance.typeId ? activeAlliance.typeId.toString() : "",
                start_date: DateService.toInput(activeAlliance.startDate) || DateService.todayInput(),
                validity: activeAlliance.validity ? activeAlliance.validity.toString() : "",
                certified: activeAlliance.certified === 1,
            })
        } else {
            setFormData({
                name: "",
                type_id: "",
                start_date: DateService.todayInput(),
                validity: "",
                certified: false,
            })
        }
    }, [activeAlliance, open, isEdit])

    const mutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const url = isEdit ? `/api/donations/alliances/${initialAlliance.id}` : "/api/donations/alliances"
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
                throw new Error(error.error || "Error saving alliance")
            }

            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["alliances"] })
            toast.success(isEdit ? "Alianza actualizada" : "Alianza creada")
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
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Editar Alianza" : "Nueva Alianza"}</DialogTitle>
                    <DialogDescription>
                        Ingrese la información de la alianza estratégica.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="name">Nombre *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="Nombre de la alianza"
                            />
                        </div>

                        {/* Type */}
                        <div className="space-y-2">
                            <Label>Tipo de Alianza</Label>
                            <Select value={formData.type_id} onValueChange={(val) => setFormData({ ...formData, type_id: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {typeOptions.map((t: any) => (
                                        <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Start Date */}
                        <div className="space-y-2">
                            <Label htmlFor="start_date">Fecha de Inicio *</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                required
                            />
                        </div>

                        {/* Validity */}
                        <div className="space-y-2">
                            <Label htmlFor="validity">Vigencia (Meses)</Label>
                            <Input
                                id="validity"
                                type="number"
                                min="1"
                                value={formData.validity}
                                onChange={(e) => setFormData({ ...formData, validity: e.target.value })}
                                placeholder="Ej: 12"
                            />
                        </div>

                        {/* Certified */}
                        <div className="space-y-2 pt-8">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="certified"
                                    checked={formData.certified}
                                    onCheckedChange={(checked) => setFormData({ ...formData, certified: checked === true })}
                                />
                                <Label htmlFor="certified" className="cursor-pointer">Sí, certificado entregado</Label>
                            </div>
                        </div>
                    </div>

                    {/* Files */}
                    <div className="border-t pt-6 space-y-4">
                        <Label className="text-lg font-medium">Contrato y Anexos</Label>
                        <ModelAttachments
                            ref={attachmentsRef}
                            areaSlug="donaciones"
                            initialFiles={activeAlliance?.files || []}
                            modelId={activeAlliance?.id}
                            modelType="App\Models\Alliance"
                            onUpdate={() => {
                                if (activeAlliance?.id) {
                                    queryClient.invalidateQueries({ queryKey: ["alliance", activeAlliance.id] })
                                }
                            }}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? (isEdit ? "Actualizando..." : "Guardando...") : (isEdit ? "Actualizar Alianza" : "Guardar Alianza")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
