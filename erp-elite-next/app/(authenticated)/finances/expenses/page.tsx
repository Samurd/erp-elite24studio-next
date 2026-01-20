"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, Filter, Download } from "lucide-react"
import { toast } from "sonner"
import ExpensesStats from "./components/ExpensesStats"
import ExpensesTable from "./components/ExpensesTable"
import ExpensesFormModal from "./components/ExpensesFormModal"
import { Card, CardContent } from "@/components/ui/card"

export default function ExpensesPage() {
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState("")
    const [mode, setMode] = useState<"create" | "edit">("create")
    const [selectedItem, setSelectedItem] = useState<any>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const queryClient = useQueryClient()

    // Fetch Expenses
    const { data, isLoading } = useQuery({
        queryKey: ["expenses", page, search],
        queryFn: () => fetch(`/api/finances/expenses?page=${page}&search=${search}`).then(res => res.json())
    })

    // Fetch Options
    const { data: options } = useQuery({
        queryKey: ["expenses-options"],
        queryFn: () => fetch("/api/finances/expenses/options").then(res => res.json())
    })

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/finances/expenses/${id}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Error eliminando egreso")
            return res.json()
        },
        onSuccess: () => {
            toast.success("Egreso eliminado")
            queryClient.invalidateQueries({ queryKey: ["expenses"] })
            queryClient.invalidateQueries({ queryKey: ["expenses-stats"] })
        },
        onError: () => toast.error("Error al eliminar")
    })

    const handleCreate = () => {
        setMode("create")
        setSelectedItem(null)
        setIsModalOpen(true)
    }

    const handleEdit = (item: any) => {
        setMode("edit")
        setSelectedItem(item)
        setIsModalOpen(true)
    }

    const handleDelete = (id: number) => {
        if (confirm("¿Está seguro de eliminar este egreso?")) {
            deleteMutation.mutate(id)
        }
    }

    return (
        <div className="p-6 h-[calc(100vh-4rem)] overflow-hidden flex flex-col gap-6 bg-gray-100 text-gray-900">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">
                    Costos y Gastos
                </h1>
                <div className="flex gap-2">
                    {/* Placeholder buttons for export/filter */}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0">
                {/* Left Column: Stats (5 cols) - Contains Totals, Charts, Top 5 */}
                <div className="lg:col-span-5 h-full overflow-y-auto pr-2 custom-scrollbar">
                    <ExpensesStats />
                </div>

                {/* Right Column: List (7 cols) - Light Theme */}
                <div className="lg:col-span-7 h-full flex flex-col min-h-0 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                        <h3 className="text-xl font-bold">Gastos Transacción</h3>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Buscar gastos..."
                                    className="pl-9 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-yellow-500 rounded-lg"
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                />
                            </div>
                            <Button onClick={handleCreate} className="bg-yellow-700 hover:bg-yellow-800 text-white whitespace-nowrap">
                                <Plus className="mr-2 h-4 w-4" /> Nuevo Gasto
                            </Button>
                        </div>
                    </div>

                    {/* Table Area */}
                    <div className="flex-1 overflow-auto custom-scrollbar rounded-lg">
                        <ExpensesTable
                            data={data?.data || []}
                            meta={data?.meta}
                            onPageChange={setPage}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            isLoading={isLoading}
                        />
                    </div>
                </div>
            </div>

            {/* Modal */}
            <ExpensesFormModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                mode={mode}
                expense={selectedItem}
                categoryOptions={options?.categories || []}
                resultOptions={options?.results || []}
                userOptions={options?.users || []}
            />
        </div>
    )
}
