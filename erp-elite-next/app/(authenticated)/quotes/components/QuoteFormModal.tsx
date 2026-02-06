"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import ModelAttachments, { ModelAttachmentsRef } from "@/components/cloud/ModelAttachments"
import { useForm, Controller } from "react-hook-form"
import { Calendar, DollarSign, User, FileText } from "lucide-react"
import MoneyInput from "@/components/ui/money-input"
import { DateService } from "@/lib/date-service"

interface QuoteFormModalProps {
    open: boolean
    onClose: () => void
    quote?: any | null
    mode?: "create" | "edit" | "view"
    contactOptions: any[]
    statusOptions: any[]
}

const EMPTY_FILES: any[] = []

export default function QuoteFormModal({
    open,
    onClose,
    quote: initialQuote,
    mode = "create",
    contactOptions,
    statusOptions
}: QuoteFormModalProps) {
    const isView = mode === "view"
    const isEdit = mode === "edit" || mode === "view"
    const queryClient = useQueryClient()
    const attachmentsRef = useRef<ModelAttachmentsRef>(null)

    // Use a stable reference for files. 
    const filesData = initialQuote?.files || EMPTY_FILES

    const memoizedInitialQuoteFiles = useMemo(() => {
        return filesData
    }, [JSON.stringify(filesData)])

    const { control, register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm({
        defaultValues: {
            contact_id: "",
            issued_at: DateService.todayInput(),
            status_id: "",
            total: 0,
        }
    })

    // Fetch full quote details including files when in edit/view mode
    const { data: quoteDetails } = useQuery({
        queryKey: ["quote", initialQuote?.id],
        queryFn: async () => {
            if (!initialQuote?.id) return null
            const res = await fetch(`/api/quotes/${initialQuote.id}`)
            if (!res.ok) throw new Error("Failed to fetch quote details")
            return res.json()
        },
        enabled: !!initialQuote?.id && open
    })

    const effectiveQuote = quoteDetails || initialQuote

    useEffect(() => {
        if (open) {
            if (effectiveQuote) {
                setValue("contact_id", effectiveQuote.contactId ? effectiveQuote.contactId.toString() : "")
                setValue("issued_at", effectiveQuote.issuedAt ? effectiveQuote.issuedAt.split('T')[0] : "")
                setValue("status_id", effectiveQuote.statusId ? effectiveQuote.statusId.toString() : "")
                // Convert decimal to cents for MoneyInput
                const validTotal = effectiveQuote.total ? Number(effectiveQuote.total) : 0
                setValue("total", Math.round(validTotal * 100))
            } else {
                reset({
                    contact_id: "",
                    issued_at: DateService.todayInput(),
                    status_id: "",
                    total: 0,
                })
            }
        }
    }, [open, effectiveQuote, reset, setValue])

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            // Upload files logic
            const allFileIds = await attachmentsRef.current?.upload() || []

            // Convert cents back to standard unit
            const payload = {
                ...data,
                total: data.total / 100,
                pending_file_ids: allFileIds
            }

            const res = await fetch("/api/quotes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            if (!res.ok) throw new Error("Error creating quote")
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["quotes"] })
            toast.success("Cotización creada exitosamente")
            onClose()
        },
        onError: (err: any) => toast.error(err.message)
    })

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            // Convert cents back to standard unit
            const payload = {
                ...data,
                total: data.total / 100
            }

            const res = await fetch(`/api/quotes/${initialQuote.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            if (!res.ok) throw new Error("Error updating quote")
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["quotes"] })
            toast.success("Cotización actualizada exitosamente")
            onClose()
        },
        onError: (err: any) => toast.error(err.message)
    })

    const onSubmit = (data: any) => {
        if (mode === 'create') {
            createMutation.mutate(data)
        } else if (mode === 'edit') {
            updateMutation.mutate(data)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-h-[90vh] min-w-[50vw] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create' ? 'Nueva Cotización' : mode === 'edit' ? 'Editar Cotización' : 'Detalles de la Cotización'}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'create' ? 'Complete los datos para registrar una nueva cotización.' :
                            mode === 'edit' ? 'Modifique los datos de la cotización.' :
                                'Información completa de la cotización.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Contact */}
                        <div className="space-y-2">
                            <Label htmlFor="contact_id">Contacto</Label>
                            <div className="relative">
                                <Controller
                                    name="contact_id"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value?.toString()} disabled={isView}>
                                            <SelectTrigger className="pl-9">
                                                <User className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                                <SelectValue placeholder="Seleccionar contacto..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {contactOptions.map(contact => (
                                                    <SelectItem key={contact.id} value={contact.id.toString()}>
                                                        {contact.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Date */}
                        <div className="space-y-2">
                            <Label htmlFor="issued_at">Fecha de Emisión *</Label>
                            <div className="relative">
                                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                <Input type="date" id="issued_at" className="pl-9" {...register("issued_at", { required: true })} disabled={isView} />
                            </div>
                            {errors.issued_at && <span className="text-red-500 text-xs">Requerido</span>}
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <Label htmlFor="status_id">Estado</Label>
                            <Controller
                                name="status_id"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value?.toString()} disabled={isView}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar estado..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statusOptions.map(status => (
                                                <SelectItem key={status.id} value={status.id.toString()}>
                                                    {status.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        {/* Total */}
                        <div className="space-y-2">
                            <Controller
                                name="total"
                                control={control}
                                render={({ field }) => (
                                    <MoneyInput
                                        id="total"
                                        label="Total"
                                        value={field.value}
                                        onChange={field.onChange}
                                        disabled={isView}
                                    />
                                )}
                            />
                        </div>
                    </div>

                    {/* Attachments Section */}
                    <div className="border-t pt-4">
                        <Label className="text-base font-semibold mb-4 block">Archivos Adjuntos</Label>
                        <ModelAttachments
                            ref={attachmentsRef}
                            areaSlug="cotizaciones"
                            modelId={effectiveQuote?.id}
                            modelType="App\Models\Quote"
                            initialFiles={effectiveQuote?.files || []}
                            readOnly={isView}
                            onUpdate={() => {
                                if (effectiveQuote?.id) {
                                    queryClient.invalidateQueries({ queryKey: ["quote", effectiveQuote.id] })
                                    queryClient.invalidateQueries({ queryKey: ["quotes"] })
                                }
                            }}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            {isView ? 'Cerrar' : 'Cancelar'}
                        </Button>
                        {!isView && (
                            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : (mode === 'create' ? 'Guardar' : 'Actualizar')}
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
