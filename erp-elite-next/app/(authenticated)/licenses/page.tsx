"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Search, Plus, Filter } from "lucide-react"

import { DateService } from "@/lib/date-service"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import LicensesTable from "./components/LicensesTable"
import LicenseFormModal from "./components/LicenseFormModal"

export default function LicensesPage() {
    const queryClient = useQueryClient()

    // Pagination & Filters State
    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(10)
    const [search, setSearch] = useState("")
    const [typeFilter, setTypeFilter] = useState("")
    const [statusFilter, setStatusFilter] = useState("")
    const [entityFilter, setEntityFilter] = useState("")
    const [companyFilter, setCompanyFilter] = useState("")
    const [extensionFilter, setExtensionFilter] = useState("all") // 'all', '1', '0'
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")

    // Modal State
    const [modalOpen, setModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create")
    const [selectedLicense, setSelectedLicense] = useState<any>(null)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [licenseToDelete, setLicenseToDelete] = useState<any>(null)

    // Data Fetching
    const { data: licensesData, isLoading: isLoadingLicenses } = useQuery({
        queryKey: ["licenses", page, perPage, search, typeFilter, statusFilter, entityFilter, companyFilter, extensionFilter, dateFrom, dateTo],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                per_page: perPage.toString(),
                search,
                license_type_filter: typeFilter,
                status_filter: statusFilter,
                entity_filter: entityFilter,
                company_filter: companyFilter,
                requires_extension_filter: extensionFilter === "all" ? "" : extensionFilter,
                date_from: dateFrom,
                date_to: dateTo
            })
            const res = await fetch(`/api/licenses?${params}`)
            if (!res.ok) throw new Error("Failed to fetch licenses")
            return res.json()
        }
    })

    const { data: optionsData } = useQuery({
        queryKey: ["license-options"],
        queryFn: async () => {
            const res = await fetch("/api/licenses/options")
            if (!res.ok) throw new Error("Failed to fetch options")
            const data = await res.json()
            // Ensure projects are returned
            if (!data.projectOptions) data.projectOptions = []
            return data
        }
    })

    // Mutations
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/licenses/${id}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Failed to delete license")
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["licenses"] })
            toast.success("Licencia eliminada")
            setDeleteModalOpen(false)
        },
        onError: (error: any) => {
            toast.error(error.message)
        }
    })

    // Handlers
    const handleOpenModal = (mode: "create" | "edit" | "view", license: any = null) => {
        setModalMode(mode)
        setSelectedLicense(license)
        setModalOpen(true)
    }

    const handleDeleteClick = (license: any) => {
        setLicenseToDelete(license)
        setDeleteModalOpen(true)
    }

    const handleConfirmDelete = () => {
        if (licenseToDelete) {
            deleteMutation.mutate(licenseToDelete.id)
        }
    }

    const clearFilters = () => {
        setSearch("")
        setTypeFilter("")
        setStatusFilter("")
        setEntityFilter("")
        setCompanyFilter("")
        setExtensionFilter("all")
        setDateFrom("")
        setDateTo("")
        setPage(1)
    }

    return (
        <div className="flex-1 p-8 bg-gray-50/50 h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Licencias</h1>
                    <p className="text-muted-foreground mt-1">Gestión de licencias del sistema.</p>
                </div>
                <Button onClick={() => handleOpenModal("create")} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                    <Plus className="mr-2 h-4 w-4" /> Nueva Licencia
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Búsqueda</label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Entidad, empresa o erradicado..."
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Type Filter */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Tipo</label>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {optionsData?.licenseTypeOptions?.map((opt: any) => (
                                    <SelectItem key={opt.id} value={opt.id.toString()}>{opt.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Estado</label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {optionsData?.statusOptions?.map((opt: any) => (
                                    <SelectItem key={opt.id} value={opt.id.toString()}>{opt.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Entity Filter */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Entidad</label>
                        <Input
                            placeholder="Nombre entidad..."
                            value={entityFilter}
                            onChange={(e) => setEntityFilter(e.target.value)}
                        />
                    </div>

                    {/* Company Filter */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Empresa</label>
                        <Input
                            placeholder="Nombre empresa..."
                            value={companyFilter}
                            onChange={(e) => setCompanyFilter(e.target.value)}
                        />
                    </div>

                    {/* Extension Filter */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Requiere Prórroga</label>
                        <Select value={extensionFilter} onValueChange={setExtensionFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="1">Sí</SelectItem>
                                <SelectItem value="0">No</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Date From */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Vencimiento Desde</label>
                        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    </div>

                    {/* Date To */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Vencimiento Hasta</label>
                        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    </div>
                </div>

                <div className="flex justify-end mt-4">
                    <Button variant="outline" size="sm" onClick={clearFilters} className="text-gray-500">
                        <Filter className="w-3 h-3 mr-1" /> Limpiar Filtros
                    </Button>
                </div>
            </div>

            {/* Table */}
            <LicensesTable
                licenses={licensesData?.data || []}
                onEdit={(license) => handleOpenModal("edit", license)}
                onDelete={handleDeleteClick}
            />

            {/* Pagination settings (basic implementation) */}
            {licensesData?.meta && (
                <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-500">
                        Mostrando {((licensesData.meta.current_page - 1) * licensesData.meta.per_page) + 1} a {Math.min(licensesData.meta.current_page * licensesData.meta.per_page, licensesData.meta.total)} de {licensesData.meta.total} resultados
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={licensesData.meta.current_page === 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={licensesData.meta.current_page === licensesData.meta.last_page}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
            )}

            <LicenseFormModal
                key={selectedLicense?.id ? `edit-${selectedLicense.id}` : "create"}
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                mode={modalMode}
                license={selectedLicense}
                typeOptions={optionsData?.licenseTypeOptions || []}
                statusOptions={optionsData?.statusOptions || []}
                projectOptions={optionsData?.projectOptions || []}
            />

            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Eliminar licencia?</DialogTitle>
                        <DialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente la licencia y sus archivos asociados.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>Eliminar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}
