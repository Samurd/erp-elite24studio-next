"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import MoneyInput from "@/components/ui/money-input"
import MoneyDisplay from "@/components/ui/money-display"
import ModelAttachmentsCreator, { PendingFile } from "@/components/cloud/ModelAttachmentsCreator"
import ModelAttachments from "@/components/cloud/ModelAttachments"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RichSelect } from "@/components/ui/rich-select"
import { DateService } from "@/lib/date-service"

interface PayrollsFormModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode: 'create' | 'edit' | 'view'
    initialData?: any
    onSuccess: () => void
}

export function PayrollsFormModal({ open, onOpenChange, mode, initialData, onSuccess }: PayrollsFormModalProps) {
    const [employees, setEmployees] = useState<any[]>([])
    const [statusOptions, setStatusOptions] = useState<any[]>([])
    const [loadingOptions, setLoadingOptions] = useState(false)
    const [saving, setSaving] = useState(false)

    // Split file states
    const [newFiles, setNewFiles] = useState<File[]>([])
    const [cloudFiles, setCloudFiles] = useState<PendingFile[]>([])

    const [detailData, setDetailData] = useState<any>(null) // For view/edit full fetch

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
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
                setNewFiles([])
                setCloudFiles([])
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

    const onSubmit = async (data: any) => {
        setSaving(true)
        try {
            // 1. Upload new files
            const uploadedIds: number[] = []
            if (newFiles.length > 0) {
                const { uploadFile } = await import("@/actions/files") // Dynamic import to avoid server action issues if any

                for (const file of newFiles) {
                    const formData = new FormData()
                    formData.append('file', file)
                    const res = await uploadFile(formData)
                    if (res && res.success && res.file) {
                        uploadedIds.push(res.file.id)
                    } else {
                        toast.error(`Error al subir archivo: ${file.name}`)
                        setSaving(false)
                        return // Stop submission
                    }
                }
            }

            // 2. Combine IDs
            const allPendingIds = [
                ...cloudFiles.map(f => f.id),
                ...uploadedIds
            ]

            const payload = {
                ...data,
                pending_file_ids: allPendingIds
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

            if (!res.ok) throw new Error("Error al guardar")

            toast.success(mode === 'create' ? "Nómina creada exitosamente" : "Nómina actualizada exitosamente")
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error("Error al guardar la nómina")
        } finally {
            setSaving(false)
        }
    }



    const isView = mode === 'view'

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
                            <RichSelect
                                placeholder="Seleccionar empleado"
                                options={employees.map(emp => ({
                                    id: String(emp.id),
                                    name: emp.fullName,
                                    profile_photo_url: emp.profilePhotoUrl // Assuming this property exists in the API response or modify accordingly
                                }))}
                                value={watch("employee_id")}
                                onValueChange={(val) => setValue("employee_id", val)}
                                disabled={isView}
                            />
                            {errors.employee_id && <p className="text-sm text-red-500">Requerido</p>}
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <Label>Estado</Label>
                            <Select
                                disabled={isView}
                                onValueChange={(val) => setValue("status_id", val)}
                                value={watch("status_id")}
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
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Subtotal */}
                        <div className="space-y-2">
                            <Label>Subtotal</Label>
                            <MoneyInput
                                value={watch("subtotal")}
                                onChange={(val) => setValue("subtotal", val)}
                                disabled={isView}
                            />
                        </div>

                        {/* Bonos */}
                        <div className="space-y-2">
                            <Label>Bonos</Label>
                            <MoneyInput
                                value={watch("bonos")}
                                onChange={(val) => setValue("bonos", val)}
                                disabled={isView}
                            />
                        </div>

                        {/* Deductions */}
                        <div className="space-y-2">
                            <Label>Deducciones</Label>
                            <MoneyInput
                                value={watch("deductions")}
                                onChange={(val) => setValue("deductions", val)}
                                disabled={isView}
                            />
                        </div>

                        {/* Total (ReadOnly) */}
                        <div className="space-y-2">
                            <Label>Total Neto</Label>
                            <div className="p-2 border rounded-md bg-gray-50 font-bold text-lg text-right">
                                <MoneyDisplay value={watch("total")} />
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

                        {/* Edit/View Mode: Existing Files */}
                        {/* Edit/View Mode: Use ModelAttachments for live management */}
                        {(mode === 'edit' || mode === 'view') && initialData?.id && (
                            <div className="mb-4">
                                <ModelAttachments
                                    modelId={initialData.id}
                                    modelType="App\Models\Payroll"
                                    initialFiles={detailData?.files || []}
                                />
                            </div>
                        )}

                        {/* Create Mode ONLY: Add New Files using Creator */}
                        {mode === 'create' && (
                            <ModelAttachmentsCreator
                                files={newFiles}
                                onFilesChange={setNewFiles}
                                pendingCloudFiles={cloudFiles}
                                onPendingCloudFilesChange={setCloudFiles}
                            />
                        )}
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
