"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Search, Plus, Filter } from "lucide-react"

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
import { RichSelect } from "@/components/ui/rich-select"

import CertificatesTable from "./components/CertificatesTable"
import CertificateFormModal from "./components/CertificateFormModal"

export default function CertificatesPage() {
    const queryClient = useQueryClient()

    // State
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState("")
    const [typeFilter, setTypeFilter] = useState("")
    const [statusFilter, setStatusFilter] = useState("")
    const [assignedToFilter, setAssignedToFilter] = useState("")
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")

    const [modalState, setModalState] = useState<{ open: boolean, mode: "create" | "edit" | "view", certificate: any | null }>({
        open: false,
        mode: "create",
        certificate: null
    })
    const [deletingCertificate, setDeletingCertificate] = useState<any>(null)

    // Data Fetching
    const { data: optionsData } = useQuery({
        queryKey: ["certificate-options"],
        queryFn: async () => {
            const res = await fetch("/api/certificates/options")
            if (!res.ok) throw new Error("Failed to fetch options")
            return res.json()
        }
    })

    const { data: certificatesData, isLoading } = useQuery({
        queryKey: ["certificates", page, search, typeFilter, statusFilter, assignedToFilter, dateFrom, dateTo],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                per_page: "10",
                search,
                type_filter: typeFilter,
                status_filter: statusFilter,
                assigned_to_filter: assignedToFilter,
                date_from: dateFrom,
                date_to: dateTo
            })
            const res = await fetch(`/api/certificates?${params}`)
            if (!res.ok) throw new Error("Failed to fetch certificates")
            return res.json()
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/certificates/${id}`, {
                method: "DELETE"
            })
            if (!res.ok) throw new Error("Failed to delete certificate")
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["certificates"] })
            setDeletingCertificate(null)
            toast.success("Certificado eliminado")
        },
        onError: (error: any) => {
            toast.error(error.message)
        }
    })

    // Handlers
    const handleOpenModal = (mode: "create" | "edit" | "view", certificate: any = null) => {
        setModalState({ open: true, mode, certificate })
    }

    const handleCloseModal = () => {
        setModalState(prev => ({ ...prev, open: false }))
    }

    const handleDelete = () => {
        if (deletingCertificate) {
            deleteMutation.mutate(deletingCertificate.id)
        }
    }

    const clearFilters = () => {
        setSearch("")
        setTypeFilter("")
        setStatusFilter("")
        setAssignedToFilter("")
        setDateFrom("")
        setDateTo("")
        setPage(1)
    }

    const typeOptions = optionsData?.typeOptions || []
    const statusOptions = optionsData?.statusOptions || []
    const userOptions = optionsData?.userOptions || []

    return (
        <div className="flex-1 p-8 bg-gray-50/50 h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Certificados</h1>
                    <p className="text-muted-foreground mt-1">Gestión de certificados y documentos.</p>
                </div>
                <Button onClick={() => handleOpenModal("create")} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Certificado
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Búsqueda</label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Nombre o descripción..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tipo</label>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {typeOptions.map((t: any) => (
                                    <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Estado</label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {statusOptions.map((s: any) => (
                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Responsable</label>
                        <RichSelect
                            value={assignedToFilter === "all" || assignedToFilter === "" ? undefined : assignedToFilter}
                            onValueChange={(val) => setAssignedToFilter(val ? val.toString() : "")}
                            options={userOptions.map((u: any) => ({ id: u.id.toString(), name: u.name, image: u.image }))}
                            placeholder="Todos"
                            imageKey="image"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Emisión Desde</label>
                        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Emisión Hasta</label>
                        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    </div>

                    <div className="lg:col-span-2 flex items-end">
                        <Button variant="outline" onClick={clearFilters} className="w-full">
                            <Filter className="mr-2 h-4 w-4" /> Limpiar Filtros
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <CertificatesTable
                data={certificatesData?.data || []}
                onView={(cert) => handleOpenModal("view", cert)}
                onEdit={(cert) => handleOpenModal("edit", cert)}
                onDelete={(cert) => setDeletingCertificate(cert)}
            />

            {/* Pagination */}
            {certificatesData?.meta && (
                <div className="flex items-center justify-between px-4 py-4 bg-white rounded-lg shadow-sm border border-t border-gray-100 mt-4">
                    <div className="text-sm text-muted-foreground">
                        Mostrando {((page - 1) * 10) + 1} a {Math.min(page * 10, certificatesData.meta.total)} de {certificatesData.meta.total} resultados
                    </div>
                    <div className="flex items-center space-x-2">
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
                            disabled={page >= certificatesData.meta.last_page}
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
            )}

            {/* Create/Edit/View Modal */}
            <CertificateFormModal
                open={modalState.open}
                onClose={handleCloseModal}
                certificate={modalState.certificate}
                mode={modalState.mode}
                typeOptions={typeOptions}
                statusOptions={statusOptions}
                userOptions={userOptions}
            />

            {/* Delete Confirmation */}
            <Dialog open={!!deletingCertificate} onOpenChange={(val) => !val && setDeletingCertificate(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eliminar Certificado</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que quieres eliminar este certificado? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletingCertificate(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
