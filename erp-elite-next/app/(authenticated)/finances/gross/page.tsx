"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Search, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import GrossIncomeTable from "./components/GrossIncomeTable"
import GrossIncomeFormModal from "./components/GrossIncomeFormModal"
import GrossIncomeStats from "./components/GrossIncomeStats"

export default function GrossFinancesPage() {
    const queryClient = useQueryClient()

    // State
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState("")
    const [modalState, setModalState] = useState<{ open: boolean, mode: "create" | "edit", income: any | null }>({
        open: false,
        mode: "create",
        income: null
    })
    const [deletingIncome, setDeletingIncome] = useState<any>(null)

    // Data Fetching: Options
    const { data: optionsData } = useQuery({
        queryKey: ["gross-income-options"],
        queryFn: async () => {
            const res = await fetch("/api/finances/gross/options")
            if (!res.ok) throw new Error("Failed to fetch options")
            return res.json()
        }
    })

    // Data Fetching: List
    const { data: incomesData, isLoading } = useQuery({
        queryKey: ["gross-incomes", page, search],
        queryFn: async () => {
            // Debounce search could be handled here or in UI input, 
            // for now passing directly but usually requires debouncing.
            // I'll add simple keyup enter normally, but for simplicity relying on state.
            const params = new URLSearchParams({
                page: page.toString(),
                per_page: "10",
                search,
            })
            const res = await fetch(`/api/finances/gross?${params}`)
            if (!res.ok) throw new Error("Failed to fetch incomes")
            return res.json()
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/finances/gross/${id}`, {
                method: "DELETE"
            })
            if (!res.ok) throw new Error("Failed to delete income")
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["gross-incomes"] })
            queryClient.invalidateQueries({ queryKey: ["gross-stats"] })
            setDeletingIncome(null)
            toast.success("Ingreso eliminado")
        },
        onError: (error: any) => {
            toast.error(error.message)
        }
    })

    // Handlers
    const handleOpenModal = (mode: "create" | "edit", income: any = null) => {
        setModalState({ open: true, mode, income })
    }

    const handleCloseModal = () => {
        setModalState(prev => ({ ...prev, open: false }))
    }

    const handleDelete = () => {
        if (deletingIncome) {
            deleteMutation.mutate(deletingIncome.id)
        }
    }

    const handleSearchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            // Invalidate to force refetch if query key depends on search which is state
            queryClient.invalidateQueries({ queryKey: ["gross-incomes"] })
        }
    }

    const typeOptions = optionsData?.incomeTypes || []
    const categoryOptions = optionsData?.categories || []
    const resultOptions = optionsData?.results || []
    const userOptions = optionsData?.users || []

    return (
        <div className="flex-1 p-8 bg-gray-50/50 h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Ingreso Bruto</h1>
                    <p className="text-muted-foreground mt-1">Gestión de ingresos brutos y estadísticas.</p>
                </div>
                {/* Mobile header action if needed, but usually empty here */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
                {/* Left Column: Stats */}
                <div className="space-y-6">
                    <GrossIncomeStats />
                </div>

                {/* Right Column: Table & Actions */}
                <div className="bg-white rounded-2xl shadow-lg p-6 h-fit">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <h3 className="text-xl font-bold text-gray-800">Ingresos Transacción</h3>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Buscar ingresos..."
                                    className="pl-9"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={handleSearchEnter}
                                />
                            </div>

                            <Button
                                onClick={() => handleOpenModal("create")}
                                className="bg-yellow-600 hover:bg-yellow-700 text-white whitespace-nowrap"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Nuevo Ingreso
                            </Button>
                        </div>
                    </div>

                    <GrossIncomeTable
                        data={incomesData?.data || []}
                        onEdit={(item) => handleOpenModal("edit", item)}
                        onDelete={(item) => setDeletingIncome(item)}
                    />

                    {/* Pagination */}
                    {incomesData?.meta && (
                        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                            <div>
                                Mostrando {((page - 1) * 10) + 1} a {Math.min(page * 10, incomesData.meta.total)} de {incomesData.meta.total} resultados
                            </div>
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Anterior
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={page >= incomesData.meta.last_page}
                                >
                                    Siguiente
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            <GrossIncomeFormModal
                open={modalState.open}
                onClose={handleCloseModal}
                income={modalState.income}
                mode={modalState.mode}
                typeOptions={typeOptions}
                categoryOptions={categoryOptions}
                resultOptions={resultOptions}
                userOptions={userOptions}
            />

            {/* Delete Confirmation */}
            <Dialog open={!!deletingIncome} onOpenChange={(val) => !val && setDeletingIncome(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eliminar Ingreso</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que quieres eliminar este ingreso? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletingIncome(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
