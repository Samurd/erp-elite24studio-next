"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Filter, X } from "lucide-react"
import QuotesTable from "./components/QuotesTable"
import QuoteFormModal from "./components/QuoteFormModal"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"

export default function QuotesPage() {
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")

    // Modal State
    const [isAppModalOpen, setAppModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create")
    const [selectedQuote, setSelectedQuote] = useState<any | null>(null)

    // Fetch Options
    const { data: optionsData } = useQuery({
        queryKey: ['quotes-options'],
        queryFn: async () => {
            const res = await fetch('/api/quotes/options')
            if (!res.ok) throw new Error('Failed to fetch options')
            return res.json()
        }
    })

    const statusOptions = optionsData?.statusOptions || []
    const contactOptions = optionsData?.contactOptions || []

    // Fetch Quotes
    const { data: quotesData, isLoading } = useQuery({
        queryKey: ['quotes', page, search, statusFilter, dateFrom, dateTo],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                search,
                status_filter: statusFilter,
                date_from: dateFrom,
                date_to: dateTo
            })
            const res = await fetch(`/api/quotes?${params.toString()}`)
            if (!res.ok) throw new Error('Failed to fetch quotes')
            return res.json()
        }
    })

    const quotes = quotesData?.data || []
    const meta = quotesData?.meta || { lastPage: 1 }

    // Handlers
    const handleCreate = () => {
        setModalMode("create")
        setSelectedQuote(null)
        setAppModalOpen(true)
    }

    const handleEdit = (quote: any) => {
        setModalMode("edit")
        setSelectedQuote(quote)
        setAppModalOpen(true)
    }

    const handleView = (quote: any) => {
        setModalMode("view")
        setSelectedQuote(quote)
        setAppModalOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm("¿Está seguro de eliminar esta cotización?")) return
        try {
            const res = await fetch(`/api/quotes/${id}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Error deleting quote")
            // Invalidate query handled by generic error/success handling usually or just refresh
            // Here just manual reload or we could import queryClient
            window.location.reload()
        } catch (error) {
            console.error(error)
            alert("Error al eliminar")
        }
    }

    const clearFilters = () => {
        setSearch("")
        setStatusFilter("all")
        setDateFrom("")
        setDateTo("")
        setPage(1)
    }

    return (
        <div className="space-y-6 bg-gray-50/50 p-8 h-full overflow-y-auto">
            <div className="max-w-8xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Cotizaciones</h1>
                        <p className="text-muted-foreground mt-1">Gestión de cotizaciones comerciales</p>
                    </div>
                    <Button onClick={handleCreate} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Cotización
                    </Button>
                </div>

                {/* Filters */}
                <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <Filter className="w-4 h-4" /> Filtros
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Buscar ID..."
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los estados</SelectItem>
                                {statusOptions.map((status: any) => (
                                    <SelectItem key={status.id} value={status.id.toString()}>
                                        {status.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-500">Desde</span>
                            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                        </div>

                        <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-500">Hasta</span>
                            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t mt-4">
                        <Button
                            variant="outline"
                            onClick={clearFilters}
                            className=""
                        >
                            <X className="w-4 h-4 mr-2" />
                            Limpiar Filtros
                        </Button>
                    </div>
                </div>

                {/* Table */}
                {isLoading ? (
                    <div className="text-center py-10 text-gray-500">Cargando cotizaciones...</div>
                ) : (
                    <div className="space-y-4">
                        <QuotesTable
                            data={quotes}
                            onView={handleView}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />

                        {/* Pagination */}
                        {meta.lastPage > 1 && (
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                    </PaginationItem>
                                    {Array.from({ length: meta.lastPage }, (_, i) => i + 1).map((p) => (
                                        <PaginationItem key={p}>
                                            <PaginationLink
                                                isActive={page === p}
                                                onClick={() => setPage(p)}
                                                className="cursor-pointer"
                                            >
                                                {p}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ))}
                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() => setPage(p => Math.min(meta.lastPage, p + 1))}
                                            className={page === meta.lastPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        )}
                    </div>
                )}
            </div>

            {/* Modal */}
            <QuoteFormModal
                open={isAppModalOpen}
                onClose={() => setAppModalOpen(false)}
                mode={modalMode}
                quote={selectedQuote}
                contactOptions={contactOptions}
                statusOptions={statusOptions}
            />
        </div>
    )
}
