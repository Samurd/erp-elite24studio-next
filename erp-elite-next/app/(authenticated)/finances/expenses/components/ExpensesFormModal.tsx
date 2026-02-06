"use client"

import { useState, useEffect, useRef } from "react"
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
// Removed ModelAttachmentsCreator
import ModelAttachments, { ModelAttachmentsRef } from "@/components/cloud/ModelAttachments"

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
    const attachmentsRef = useRef<ModelAttachmentsRef>(null)

    const [formData, setFormData] = useState({
        name: "",
        category_id: "",
        description: "",
        date: "",
        amount: 0,
        created_by_id: "",
        result_id: "",
    })

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
        }
    }, [initialExpense, open, mode])

    const mutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const url = isEdit ? `/api/finances/expenses/${initialExpense.id}` : "/api/finances/expenses"
            const method = isEdit ? "PUT" : "POST"

            // Upload files via ref
            const uploadedFileIds = await attachmentsRef.current?.upload() || []

            const payload = { ...data, amount: data.amount, pending_file_ids: uploadedFileIds }

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
        onSuccess: async () => {
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
                        <ModelAttachments
                            ref={attachmentsRef}
                            areaSlug="finanzas"
                            initialFiles={initialExpense?.files || []}
                            modelId={initialExpense?.id}
                            modelType="App\Models\Expense"
                            onUpdate={() => queryClient.invalidateQueries({ queryKey: ["expenses"] })}
                        />
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
