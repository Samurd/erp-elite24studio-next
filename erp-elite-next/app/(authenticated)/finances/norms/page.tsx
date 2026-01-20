"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { NormsTable } from "./components/NormsTable"
import { NormsFormModal } from "./components/NormsFormModal"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function NormsPage() {
    const router = useRouter()
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState("10")
    const [search, setSearch] = useState("")

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
    const [selectedItem, setSelectedItem] = useState<any>(null)

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['norms', page, pageSize, search],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: pageSize,
                search: search
            });
            const res = await fetch(`/api/finances/norms?${params}`);
            if (!res.ok) throw new Error("Failed to fetch norms");
            return res.json();
        }
    })

    const handleCreate = () => {
        setModalMode('create')
        setSelectedItem(null)
        setIsModalOpen(true)
    }

    const handleEdit = (item: any) => {
        setModalMode('edit')
        setSelectedItem(item)
        setIsModalOpen(true)
    }

    const handleView = (item: any) => {
        setModalMode('view')
        setSelectedItem(item)
        setIsModalOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm("¿Estás seguro de que quieres eliminar esta norma?")) return;

        try {
            const res = await fetch(`/api/finances/norms/${id}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Failed to delete");
            toast.success("Norma eliminada");
            refetch();
        } catch (error) {
            console.error(error);
            toast.error("Error al eliminar");
        }
    }

    const handleModalClose = () => {
        setIsModalOpen(false)
        setSelectedItem(null)
        refetch() // Refresh list on close
    }

    return (
        <div className="p-6 min-h-screen bg-gray-50 text-gray-900">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6 flex justify-between items-center border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Normas</h1>
                    <p className="text-gray-500 mt-1 text-sm">Gestión de normas y regulaciones</p>
                </div>
                <Button onClick={handleCreate} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                    <Plus className="mr-2 h-4 w-4" /> Nueva Norma
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Búsqueda</label>
                        <Input
                            placeholder="Buscar norma..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white border-gray-300"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Registros por página</label>
                        <Select value={pageSize} onValueChange={setPageSize}>
                            <SelectTrigger className="bg-white border-gray-300">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <NormsTable
                data={data?.data || []}
                meta={data?.meta}
                isLoading={isLoading}
                onPageChange={setPage}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
            />

            {/* Modal */}
            <NormsFormModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                mode={modalMode}
                initialData={selectedItem}
            />
        </div>
    )
}
