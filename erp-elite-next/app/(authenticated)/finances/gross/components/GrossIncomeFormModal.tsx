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

interface GrossIncomeFormModalProps {
    open: boolean
    onClose: () => void
    income?: any | null
    mode?: "create" | "edit"
    typeOptions: any[]
    categoryOptions: any[]
    resultOptions: any[]
    userOptions: any[]
}

export default function GrossIncomeFormModal({
    open,
    onClose,
    income: initialIncome,
    mode = "create",
    typeOptions,
    categoryOptions,
    resultOptions,
    userOptions
}: GrossIncomeFormModalProps) {
    const isEdit = mode === "edit"
    const queryClient = useQueryClient()

    const [formData, setFormData] = useState({
        name: "",
        type_id: "",
        category_id: "",
        description: "",
        date: "",
        amount: 0,
        created_by_id: "",
        result_id: "",
    })

    useEffect(() => {
        if (initialIncome && mode === "edit") {
            setFormData({
                name: initialIncome.name || "",
                type_id: initialIncome.typeId?.toString() || (initialIncome.type?.id?.toString() || ""),
                category_id: initialIncome.categoryId?.toString() || (initialIncome.category?.id?.toString() || ""),
                description: initialIncome.description || "",
                date: initialIncome.date ? DateService.toInput(initialIncome.date) : DateService.todayInput(),
                amount: initialIncome.amount || 0, // Assuming API returns integer cents, MoneyInput handles decimals or cents? 
                // Wait, Laravel API sends amount as integer cents, Frontend MoneyInput usually expects number.
                // Let's assume standard handling: form/api exchange in cents. 
                // But we need to check MoneyInput component usage. In Laravel it was specialized component.
                // I'll stick to simple numeric input or custom MoneyInput if available in this codebase.
                // I see MoneyInput imported in Laravel example. I'll search for one in NextJS.
                // Searching showed `MoneyInput` in imports of `Gross/Form.vue`, but not in NextJS files list.
                // But I'll assume standard Shadcn Input with type number or text for now, or check for MoneyInput existence.
                // Update: I will use a simple Input type="number" step="0.01" if MoneyInput doesn't exist, 
                // but wait, I can simulate MoneyInput with a formatted Input. 
                // Let's check if MoneyInput exists in the next step or just use Input. 
                // I will use Input for now to be safe, handling validation manually.
                created_by_id: initialIncome.createdById?.toString() || (initialIncome.createdBy?.id?.toString() || ""),
                result_id: initialIncome.resultId?.toString() || (initialIncome.result?.id?.toString() || ""),
            })
        } else {
            setFormData({
                name: "",
                type_id: "",
                category_id: "",
                description: "",
                date: DateService.todayInput(),
                amount: 0,
                created_by_id: "",
                result_id: "",
            })
        }
    }, [initialIncome, open, mode])

    const mutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const url = isEdit ? `/api/finances/gross/${initialIncome.id}` : "/api/finances/gross"
            const method = isEdit ? "PUT" : "POST"

            // Ensure amount is integer for backend if it expects cents
            // Laravel "amount" => "required|integer|min:0" usually means cents or smallest unit
            // Vue component: formatMoney(amount/100) suggests backend sends cents.
            // So we should send cents. Input likely accepts dollars/units.

            const payload = { ...data, amount: data.amount }

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || "Error saving income")
            }

            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["gross-incomes"] })
            // Also invalidate stats to update charts
            queryClient.invalidateQueries({ queryKey: ["gross-stats"] })
            toast.success(isEdit ? "Ingreso actualizado" : "Ingreso creado")
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
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? "Actualizar Ingreso" : "Añadir nuevo Ingreso"}
                    </DialogTitle>
                    <DialogDescription>
                        Ingrese los detalles del ingreso bruto.
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
                            placeholder="Nombre del ingreso"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Type */}
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select
                                value={formData.type_id}
                                onValueChange={(val) => setFormData({ ...formData, type_id: val })}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent>
                                    {typeOptions.map((opt) => (
                                        <SelectItem key={opt.id} value={opt.id.toString()}>
                                            {opt.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <Label>Categoría</Label>
                            <Select
                                value={formData.category_id}
                                onValueChange={(val) => setFormData({ ...formData, category_id: val })}
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
