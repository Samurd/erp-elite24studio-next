"use client"

import { useState, useEffect, useRef } from "react"
import { useForm, Controller, SubmitHandler } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import MoneyInput from "@/components/ui/money-input"
import MoneyDisplay from "@/components/ui/money-display"
// Removed ModelAttachmentsCreator import
import ModelAttachments, { ModelAttachmentsRef } from "@/components/cloud/ModelAttachments"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RichSelect } from "@/components/ui/rich-select"

interface PayrollsFormModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode: 'create' | 'edit' | 'view'
    initialData?: any
    onSuccess: () => void
}

const payrollSchema = z.object({
    employee_id: z.string().min(1, "Requerido"),
    status_id: z.string().optional(),
    subtotal: z.union([z.string(), z.number()]).transform((val) => Number(val) || 0),
    bonos: z.union([z.string(), z.number()]).transform((val) => Number(val) || 0),
    deductions: z.union([z.string(), z.number()]).transform((val) => Number(val) || 0),
    total: z.union([z.string(), z.number()]).transform((val) => Number(val) || 0),
    observations: z.string().optional(),
})

type PayrollFormValues = z.input<typeof payrollSchema>

export function PayrollsFormModal({ open, onOpenChange, mode, initialData, onSuccess }: PayrollsFormModalProps) {
    const [employees, setEmployees] = useState<any[]>([])
    const [statusOptions, setStatusOptions] = useState<any[]>([])
    const [loadingOptions, setLoadingOptions] = useState(false)
    const [saving, setSaving] = useState(false)
    const attachmentsRef = useRef<ModelAttachmentsRef>(null)

    const [detailData, setDetailData] = useState<any>(null) // For view/edit full fetch

    const { register, control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<PayrollFormValues>({
        resolver: zodResolver(payrollSchema),
        defaultValues: {
            employee_id: "",
            subtotal: 0,
            bonos: 0,
            deductions: 0,
            total: 0,
            status_id: "",
            observations: "",
        }
    })

    const subtotal = watch("subtotal")
    const bonos = watch("bonos")
    const deductions = watch("deductions")

    // Auto calculate total
    useEffect(() => {
        const s = parseInt(String(subtotal || 0))
        const b = parseInt(String(bonos || 0))
        const d = parseInt(String(deductions || 0))
        setValue("total", s + b - d)
    }, [subtotal, bonos, deductions, setValue])

    // Fetch options
    useEffect(() => {
        if (open) {
            fetchOptions()
            if ((mode === 'edit' || mode === 'view') && initialData?.id) {
                fetchDetail(initialData.id)
            } else {
                reset({
                    employee_id: "",
                    subtotal: 0,
                    bonos: 0,
                    deductions: 0,
                    total: 0,
                    status_id: "",
                    observations: "",
                })
                setDetailData(null)
            }
        }
    }, [open, mode, initialData])

    const fetchOptions = async () => {
        setLoadingOptions(true)
        try {
            const res = await fetch("/api/finances/payrolls/options")
            const data = await res.json()
            setEmployees(data.employees || [])
            setStatusOptions(data.statusOptions || [])
        } catch (error) {
            console.error(error)
            toast.error("Error al cargar opciones")
        } finally {
            setLoadingOptions(false)
        }
    }

    const fetchDetail = async (id: number) => {
        try {
            const res = await fetch(`/api/finances/payrolls/${id}`)
            if (!res.ok) throw new Error("Failed to fetch detail")
            const data = await res.json()
            setDetailData(data)

            // Populate form
            reset({
                employee_id: data.employeeId?.toString() || "",
                subtotal: data.subtotal || 0,
                bonos: data.bonos || 0,
                deductions: data.deductions || 0,
                total: data.total || 0,
                status_id: data.statusId?.toString() || "",
                observations: data.observations || "",
            })
        } catch (error) {
            console.error(error)
            toast.error("Error al cargar detalle")
        }
    }

    const onSubmit: SubmitHandler<PayrollFormValues> = async (data) => {
        setSaving(true)
        try {
            // Upload new files via ref
            const uploadedFileIds = await attachmentsRef.current?.upload() || []

            const payload = {
                ...data,
                pending_file_ids: uploadedFileIds
            }

            const url = mode === 'create'
                ? "/api/finances/payrolls"
                : `/api/finances/payrolls/${initialData.id}`

            const method = mode === 'create' ? "POST" : "PUT"

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                const errorText = await res.text()
                throw new Error(errorText || "Error al guardar")
            }

            toast.success(mode === 'create' ? "Nómina creada exitosamente" : "Nómina actualizada exitosamente")
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Error al guardar la nómina")
        } finally {
            setSaving(false)
        }
    }

    const isView = mode === 'view'
    // Use detailData if available (for edit/view), otherwise initialData (which might be partial), or empty for create
    const effectiveFiles = detailData?.files || initialData?.files || []
    const effectiveModelId = initialData?.id

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create' && "Crear Nómina"}
                        {mode === 'edit' && "Editar Nómina"}
                        {mode === 'view' && `Detalle de Nómina #${initialData?.id}`}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Employee */}
                        <div className="space-y-2">
                            <Label>Empleado</Label>
                            <Controller
                                name="employee_id"
                                control={control}
                                render={({ field }) => (
                                    <RichSelect
                                        placeholder="Seleccionar empleado"
                                        options={employees.map(emp => ({
                                            id: String(emp.id),
                                            name: emp.fullName,
                                            profile_photo_url: emp.profilePhotoUrl
                                        }))}
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        disabled={isView}
                                    />
                                )}
                            />
                            {errors.employee_id && <p className="text-sm text-red-500">{errors.employee_id.message as string}</p>}
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <Label>Estado</Label>
                            <Controller
                                name="status_id"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        disabled={isView}
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar estado" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statusOptions.map(st => (
                                                <SelectItem key={st.id} value={String(st.id)}>{st.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Subtotal */}
                        <div className="space-y-2">
                            <Label>Subtotal</Label>
                            <MoneyInput
                                value={Number(watch("subtotal") || 0)}
                                onChange={(val) => setValue("subtotal", val)}
                                disabled={isView}
                            />
                        </div>

                        {/* Bonos */}
                        <div className="space-y-2">
                            <Label>Bonos</Label>
                            <MoneyInput
                                value={Number(watch("bonos") || 0)}
                                onChange={(val) => setValue("bonos", val)}
                                disabled={isView}
                            />
                        </div>

                        {/* Deductions */}
                        <div className="space-y-2">
                            <Label>Deducciones</Label>
                            <MoneyInput
                                value={Number(watch("deductions") || 0)}
                                onChange={(val) => setValue("deductions", val)}
                                disabled={isView}
                            />
                        </div>

                        {/* Total (ReadOnly) */}
                        <div className="space-y-2">
                            <Label>Total Neto</Label>
                            <div className="p-2 border rounded-md bg-gray-50 font-bold text-lg text-right">
                                <MoneyDisplay value={Number(watch("total") || 0)} />
                            </div>
                        </div>
                    </div>

                    {/* Observations */}
                    <div className="space-y-2">
                        <Label>Observaciones</Label>
                        <Textarea
                            {...register("observations")}
                            placeholder="Observaciones..."
                            className="resize-none"
                            rows={4}
                            disabled={isView}
                        />
                    </div>

                    {/* Files */}
                    <div className="border-t pt-4">
                        <Label className="text-lg font-semibold mb-2 block">Archivos Adjuntos</Label>
                        <div className="mb-4">
                            <ModelAttachments
                                ref={attachmentsRef}
                                areaSlug="finanzas"
                                modelId={effectiveModelId}
                                modelType="App\Models\Payroll"
                                initialFiles={effectiveFiles}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        {!isView && (
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                                Cancelar
                            </Button>
                        )}
                        {!isView && (
                            <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700 text-white" disabled={saving}>
                                {saving ? "Guardando..." : (mode === 'create' ? "Crear Nómina" : "Actualizar")}
                            </Button>
                        )}
                        {isView && (
                            <Button type="button" className="bg-gray-600 text-white" onClick={() => onOpenChange(false)}>
                                Cerrar
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
