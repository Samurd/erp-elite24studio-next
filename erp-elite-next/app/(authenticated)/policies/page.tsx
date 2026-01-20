"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Search, Plus, Filter, Trash2, Edit, Eye, FileText } from "lucide-react"

import { DateService } from "@/lib/date-service"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { RichSelect } from "@/components/ui/rich-select"

import PolicyFormModal from "./components/PolicyFormModal"

export default function PoliciesPage() {
    const queryClient = useQueryClient()

    // State
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState("")
    const [typeFilter, setTypeFilter] = useState("")
    const [statusFilter, setStatusFilter] = useState("")
    const [assignedToFilter, setAssignedToFilter] = useState("")
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")

    const [modalState, setModalState] = useState<{ open: boolean, mode: "create" | "edit" | "view", policy: any | null }>({
        open: false,
        mode: "create",
        policy: null
    })
    const [deletingPolicy, setDeletingPolicy] = useState<any>(null)

    // Data Fetching
    const { data: optionsData } = useQuery({
        queryKey: ["policy-options"],
        queryFn: async () => {
            const res = await fetch("/api/policies/options")
            if (!res.ok) throw new Error("Failed to fetch options")
            return res.json()
        }
    })

    const { data: policiesData, isLoading } = useQuery({
        queryKey: ["policies", page, search, typeFilter, statusFilter, assignedToFilter, dateFrom, dateTo],
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
            const res = await fetch(`/api/policies?${params}`)
            if (!res.ok) throw new Error("Failed to fetch policies")
            return res.json()
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/policies/${id}`, {
                method: "DELETE"
            })
            if (!res.ok) throw new Error("Failed to delete policy")
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["policies"] })
            setDeletingPolicy(null)
            toast.success("Política eliminada")
        },
        onError: (error: any) => {
            toast.error(error.message)
        }
    })

    // Handlers
    const handleOpenModal = (mode: "create" | "edit" | "view", policy: any = null) => {
        setModalState({ open: true, mode, policy })
    }

    const handleCloseModal = () => {
        setModalState(prev => ({ ...prev, open: false }))
    }

    const handleDelete = () => {
        if (deletingPolicy) {
            deleteMutation.mutate(deletingPolicy.id)
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
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Políticas</h1>
                    <p className="text-muted-foreground mt-1">Gestión de políticas empresariales.</p>
                </div>
                <Button onClick={() => handleOpenModal("create")} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                    <Plus className="mr-2 h-4 w-4" /> Nueva Política
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[60px]">ID</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>F. Emisión</TableHead>
                            <TableHead>Últ. Revisión</TableHead>
                            <TableHead>Responsable</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Archivos</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center">Cargando...</TableCell>
                            </TableRow>
                        ) : policiesData?.data?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center">No se encontraron políticas</TableCell>
                            </TableRow>
                        ) : (
                            policiesData?.data?.map((policy: any) => (
                                <TableRow key={policy.id} className="hover:bg-gray-50">
                                    <TableCell className="font-medium">#{policy.id}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium truncate max-w-[200px]" title={policy.name}>{policy.name}</span>
                                            {policy.description && (
                                                <span className="text-muted-foreground text-xs truncate max-w-[200px]" title={policy.description}>
                                                    {policy.description}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {policy.type ? (
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                                                {policy.type.name}
                                            </Badge>
                                        ) : "-"}
                                    </TableCell>
                                    <TableCell className="text-sm">{DateService.toDisplay(policy.issuedAt)}</TableCell>
                                    <TableCell className="text-sm">{DateService.toDisplay(policy.reviewedAt)}</TableCell>
                                    <TableCell className="text-sm">{policy.assignedTo?.name || "-"}</TableCell>
                                    <TableCell>
                                        {policy.status ? (
                                            <Badge variant="secondary" style={{ backgroundColor: policy.status.color ? policy.status.color + '20' : '#e5e7eb', color: policy.status.color || '#374151' }}>
                                                {policy.status.name}
                                            </Badge>
                                        ) : "-"}
                                    </TableCell>
                                    <TableCell>
                                        {policy.filesCount > 0 ? (
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                                                {policy.filesCount}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenModal("view", policy)} title="Ver Detalles">
                                                <Eye className="h-4 w-4 text-green-600" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenModal("edit", policy)} title="Editar">
                                                <Edit className="h-4 w-4 text-blue-600" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setDeletingPolicy(policy)} title="Eliminar">
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                {policiesData?.meta && (
                    <div className="flex items-center justify-between px-4 py-4 border-t">
                        <div className="text-sm text-muted-foreground">
                            Mostrando {((page - 1) * 10) + 1} a {Math.min(page * 10, policiesData.meta.total)} de {policiesData.meta.total} resultados
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
                                disabled={page >= policiesData.meta.last_page}
                            >
                                Siguiente
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit/View Modal */}
            <PolicyFormModal
                open={modalState.open}
                onClose={handleCloseModal}
                policy={modalState.policy}
                mode={modalState.mode}
                typeOptions={typeOptions}
                statusOptions={statusOptions}
                userOptions={userOptions}
            />

            {/* Delete Confirmation */}
            <Dialog open={!!deletingPolicy} onOpenChange={(val) => !val && setDeletingPolicy(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eliminar Política</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que quieres eliminar esta política? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletingPolicy(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
