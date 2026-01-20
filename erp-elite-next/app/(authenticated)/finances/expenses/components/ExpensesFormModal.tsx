"use client"

import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { RichSelect } from "@/components/ui/rich-select"
import MoneyInput from "@/components/ui/money-input"
import { DateService } from "@/lib/date-service"
import ModelAttachmentsCreator from "@/components/cloud/ModelAttachmentsCreator"
import ModelAttachments from "@/components/cloud/ModelAttachments"
import { uploadFile, attachFileToModel } from "@/actions/files"

interface ExpensesFormModalProps {
    open: boolean
    onClose: () => void
    expense?: any | null
    mode?: "create" | "edit"
    categoryOptions: any[]
    resultOptions: any[]
    userOptions: any[]
}

export default function ExpensesFormModal({
    open,
    onClose,
    expense: initialExpense,
    mode = "create",
    categoryOptions,
    resultOptions,
    userOptions
}: ExpensesFormModalProps) {
    const isEdit = mode === "edit"
    const queryClient = useQueryClient()

    const [formData, setFormData] = useState({
        name: "",
        category_id: "",
        description: "",
        date: "",
        amount: 0,
        created_by_id: "",
        result_id: "",
    })

    // File States for Creation Mode
    const [filesToUpload, setFilesToUpload] = useState<File[]>([])
    const [pendingCloudFiles, setPendingCloudFiles] = useState<any[]>([])

    useEffect(() => {
        if (initialExpense && mode === "edit") {
            setFormData({
                name: initialExpense.name || "",
                category_id: initialExpense.categoryId?.toString() || (initialExpense.category?.id?.toString() || ""),
                description: initialExpense.description || "",
                date: initialExpense.date ? DateService.toInput(initialExpense.date) : DateService.todayInput(),
                amount: initialExpense.amount || 0,
                created_by_id: initialExpense.createdById?.toString() || (initialExpense.createdBy?.id?.toString() || ""),
                result_id: initialExpense.resultId?.toString() || (initialExpense.result?.id?.toString() || ""),
            })
            // Reset files for edit mode (handled by ModelAttachments internally)
            setFilesToUpload([])
            setPendingCloudFiles([])
        } else {
            // Create Mode
            setFormData({
                name: "",
                category_id: "",
                description: "",
                date: DateService.todayInput(),
                amount: 0,
                created_by_id: "",
                result_id: "",
            })
            setFilesToUpload([])
            setPendingCloudFiles([])
        }
    }, [initialExpense, open, mode])

    const mutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const url = isEdit ? `/api/finances/expenses/${initialExpense.id}` : "/api/finances/expenses"
            const method = isEdit ? "PUT" : "POST"

            const payload = { ...data, amount: data.amount }

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || "Error saving expense")
            }

            const responseData = await res.json()
            return responseData
        },
        onSuccess: async (data) => {
            // If Create Mode and there are files, link them now
            if (!isEdit && (filesToUpload.length > 0 || pendingCloudFiles.length > 0)) {
                // Determine expense ID (returned from POST)
                const expenseId = data.id
                try {
                    // 1. Link Cloud Files
                    for (const file of pendingCloudFiles) {
                        await attachFileToModel(file.id, 'App\\Models\\Expense', expenseId)
                    }

                    // 2. Upload and Link New Files
                    for (const file of filesToUpload) {
                        const formData = new FormData()
                        formData.append('file', file)
                        const uploadRes = await uploadFile(formData)
                        if (uploadRes.success && uploadRes.file) {
                            await attachFileToModel(uploadRes.file.id, 'App\\Models\\Expense', expenseId)
                        } else {
                            console.error("Failed to upload file during creation:", file.name)
                            toast.error(`Error al subir archivo: ${file.name}`)
                        }
                    }
                } catch (fileError) {
                    console.error("Error attaching files:", fileError)
                    toast.error("Gasto guardado, pero hubo error al adjuntar archivos.")
                }
            }

            queryClient.invalidateQueries({ queryKey: ["expenses"] })
            queryClient.invalidateQueries({ queryKey: ["expenses-stats"] })
            toast.success(isEdit ? "Egreso actualizado" : "Egreso creado")
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
                    <DialogTitle>
                        {isEdit ? "Actualizar Egreso" : "Añadir nuevo Egreso"}
                    </DialogTitle>
                    <DialogDescription>
                        Ingrese los detalles del egreso.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            placeholder="Nombre del gasto"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Category */}
                        <div className="space-y-2">
                            <Label>Categoría</Label>
                            <Select
                                value={formData.category_id}
                                onValueChange={(val) => setFormData({ ...formData, category_id: val })}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categoryOptions.map((opt) => (
                                        <SelectItem key={opt.id} value={opt.id.toString()}>
                                            {opt.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Result */}
                        <div className="space-y-2">
                            <Label>Resultado</Label>
                            <Select
                                value={formData.result_id}
                                onValueChange={(val) => setFormData({ ...formData, result_id: val })}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent>
                                    {resultOptions.map((opt) => (
                                        <SelectItem key={opt.id} value={opt.id.toString()}>
                                            {opt.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Amount */}
                    <MoneyInput
                        id="amount"
                        value={formData.amount}
                        onChange={(val) => setFormData({ ...formData, amount: val })}
                        label="Monto"
                        placeholder="$ 0,00"
                    />

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            placeholder="Agregue sus observaciones"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Date */}
                        <div className="space-y-2">
                            <Label htmlFor="date">Fecha</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>

                        {/* Responsible */}
                        <div className="space-y-2">
                            <Label>Responsable</Label>
                            <RichSelect
                                value={formData.created_by_id}
                                onValueChange={(val) => setFormData({ ...formData, created_by_id: val })}
                                options={userOptions.map(u => ({ id: u.id.toString(), name: u.name, image: u.image }))}
                                placeholder="Seleccionar"
                                imageKey="image"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t mt-4">
                        <Label>Archivos Adjuntos</Label>
                        {isEdit ? (
                            <ModelAttachments
                                initialFiles={initialExpense?.files || []}
                                modelId={initialExpense.id}
                                modelType="App\Models\Expense"
                                onUpdate={() => queryClient.invalidateQueries({ queryKey: ["expenses"] })}
                            />
                        ) : (
                            <ModelAttachmentsCreator
                                files={filesToUpload}
                                onFilesChange={setFilesToUpload}
                                pendingCloudFiles={pendingCloudFiles}
                                onPendingCloudFilesChange={setPendingCloudFiles}
                            />
                        )}
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={mutation.isPending} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                            {mutation.isPending ? "Guardando..." : (isEdit ? "Actualizar" : "Crear")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
