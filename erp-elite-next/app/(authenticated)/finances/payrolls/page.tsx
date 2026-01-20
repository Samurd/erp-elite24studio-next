"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { PayrollsTable } from "./components/PayrollsTable"
import { PayrollsFormModal } from "./components/PayrollsFormModal"
import Link from "next/link"

export default function PayrollsPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    const page = Number(searchParams.get("page")) || 1
    const search = searchParams.get("search") || ""
    const statusFilter = searchParams.get("status_filter") || ""
    const dateFrom = searchParams.get("date_from") || ""
    const dateTo = searchParams.get("date_to") || ""

    const [modalOpen, setModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
    const [selectedItem, setSelectedItem] = useState<any>(null)

    // Fetch data
    const { data, isLoading, refetch } = useQuery({
        queryKey: ["payrolls", page, search, statusFilter, dateFrom, dateTo],
        queryFn: async () => {
            const params = new URLSearchParams()
            params.set("page", page.toString())
            if (search) params.set("search", search)
            if (statusFilter) params.set("status_filter", statusFilter)
            if (dateFrom) params.set("date_from", dateFrom)
            if (dateTo) params.set("date_to", dateTo)

            const res = await fetch(`/api/finances/payrolls?${params.toString()}`)
            if (!res.ok) throw new Error("Error loading payrolls")
            return res.json()
        }
    })

    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams)
        if (term) params.set("search", term)
        else params.delete("search")
        params.set("page", "1")
        router.push(`${pathname}?${params.toString()}`)
    }

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams)
        params.set("page", newPage.toString())
        router.push(`${pathname}?${params.toString()}`)
    }

    const handleCreate = () => {
        setModalMode('create')
        setSelectedItem(null)
        setModalOpen(true)
    }

    const handleEdit = (item: any) => {
        setModalMode('edit')
        setSelectedItem(item)
        setModalOpen(true)
    }

    const handleView = (item: any) => {
        setModalMode('view')
        setSelectedItem(item)
        setModalOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm("¿Estás seguro de eliminar esta nómina?")) return

        try {
            const res = await fetch(`/api/finances/payrolls/${id}`, {
                method: "DELETE"
            })
            if (!res.ok) throw new Error("Error deleting")
            toast.success("Nómina eliminada")
            refetch()
        } catch (error) {
            toast.error("Error al eliminar")
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Nóminas</h1>
                    <p className="text-muted-foreground">Gestión de nóminas y pagos.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/finances/payrolls/stats">
                        <Button variant="outline">
                            <i className="fas fa-chart-bar mr-2"></i> Estadísticas
                        </Button>
                    </Link>
                    <Button onClick={handleCreate} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                        <Plus className="mr-2 h-4 w-4" /> Nueva Nómina
                    </Button>
                </div>
            </div>

            <div className="flex gap-4 items-center bg-white p-4 rounded-lg border shadow-sm flex-wrap">
                <Input
                    placeholder="Buscar por empleado..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="max-w-sm"
                />

                {/* Add more filters here if needed (status, dates) similar to Norms or user requirement */}
                {/* For brevity, basic search implemented. Can allow URL params to drive logic if expanded. */}
            </div>

            <PayrollsTable
                data={data?.data || []}
                meta={data?.meta}
                isLoading={isLoading}
                onPageChange={handlePageChange}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
            />

            <PayrollsFormModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                mode={modalMode}
                initialData={selectedItem}
                onSuccess={() => refetch()}
            />
        </div>
    )
}
