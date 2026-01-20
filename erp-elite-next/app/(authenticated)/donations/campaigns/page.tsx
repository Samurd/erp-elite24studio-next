"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Search, Filter, Trash2, Edit, X } from "lucide-react"
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
} from "@/components/ui/table" // Assuming these shadcn components exist, similar to other pages
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import DonationsSubmenu from "../components/DonationsSubmenu"
import CampaignFormModal from "./components/CampaignFormModal"
import { RichSelect } from "@/components/ui/rich-select"
import MoneyDisplay from "@/components/ui/money-display"

import { DateService } from "@/lib/date-service"

// Helper for date formatting
const formatDate = (dateString: string | undefined | null) => {
    return DateService.toDisplay(dateString);
};
const getDateStatus = (dateString: string | undefined | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    date.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Pasado', class: 'text-red-600' };
    if (diffDays === 0) return { text: 'Hoy', class: 'text-green-600' };
    if (diffDays <= 7) return { text: 'Próximo', class: 'text-yellow-600' };
    return null;
};

// Helper for status classes
const getStatusClasses = (statusName: string | undefined) => {
    if (!statusName) return 'bg-gray-100 text-gray-800';
    switch (statusName) {
        case 'Activa': return 'bg-green-100 text-green-800';
        case 'En Planificación': return 'bg-yellow-100 text-yellow-800';
        case 'Finalizada': return 'bg-blue-100 text-blue-800';
        case 'Cancelada': return 'bg-red-100 text-red-800';
        case 'Pausada': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

export default function CampaignsPage() {
    const queryClient = useQueryClient()

    // Filters
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("")
    const [responsibleFilter, setResponsibleFilter] = useState("")
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")
    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState("10") // String for Select

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState<"create" | "edit">("create")
    const [selectedCampaign, setSelectedCampaign] = useState<any>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    // Fetch Options
    const { data: optionsData } = useQuery({
        queryKey: ["campaigns-options"],
        queryFn: async () => {
            const res = await fetch("/api/donations/campaigns/options")
            if (!res.ok) throw new Error("Failed to fetch options")
            return res.json()
        }
    })

    const statusOptions = optionsData?.statusOptions || []
    const userOptions = optionsData?.userOptions || []

    // Fetch Campaigns
    const { data: campaignsData, isLoading } = useQuery({
        queryKey: ["campaigns", page, perPage, search, statusFilter, responsibleFilter, dateFrom, dateTo],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                per_page: perPage,
                search,
                status_filter: statusFilter,
                responsible_filter: responsibleFilter,
                date_from: dateFrom,
                date_to: dateTo
            })
            const res = await fetch(`/api/donations/campaigns?${params.toString()}`)
            if (!res.ok) throw new Error("Failed to fetch campaigns")
            return res.json()
        }
    })

    // Mutations
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/donations/campaigns/${id}`, {
                method: "DELETE",
            })
            if (!res.ok) throw new Error("Failed to delete campaign")
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["campaigns"] })
            toast.success("Campaña eliminada")
            setDeleteId(null)
        },
        onError: (err) => toast.error(err.message)
    })

    // Handlers
    const handleCreate = () => {
        setSelectedCampaign(null)
        setModalMode("create")
        setIsModalOpen(true)
    }

    const handleEdit = (campaign: any) => {
        setSelectedCampaign(campaign)
        setModalMode("edit")
        setIsModalOpen(true)
    }

    const handleDelete = () => {
        if (deleteId) deleteMutation.mutate(deleteId)
    }

    const clearFilters = () => {
        setSearch("")
        setStatusFilter("")
        setResponsibleFilter("")
        setDateFrom("")
        setDateTo("")
        setPage(1)
    }

    return (
        <div className="space-y-6">

            <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Campañas</h1>
                    <p className="text-gray-600 mt-1">Gestión de campañas de donaciones</p>
                </div>
                <Button onClick={handleCreate} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Campaña
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Búsqueda</label>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Nombre, dirección..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Estado</label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {statusOptions.map((opt: any) => (
                                    <SelectItem key={opt.id} value={opt.id.toString()}>{opt.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Responsable</label>
                        <RichSelect
                            value={responsibleFilter === "all" || responsibleFilter === "" ? undefined : responsibleFilter}
                            onValueChange={(val) => setResponsibleFilter(val ? val.toString() : "")}
                            options={userOptions.map((u: any) => ({ id: u.id.toString(), name: u.name, image: u.image }))}
                            placeholder="Todos"
                            imageKey="image"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Fecha Evento Desde</label>
                        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Fecha Evento Hasta</label>
                        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    </div>

                    <div className="flex items-end">
                        <Button variant="outline" onClick={clearFilters} className="w-full">
                            <X className="w-4 h-4 mr-2" />
                            Limpiar Filtros
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Fecha Evento</TableHead>
                            <TableHead>Dirección</TableHead>
                            <TableHead>Responsable</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Meta</TableHead>
                            <TableHead>Presupuesto</TableHead>
                            <TableHead>Total Donaciones</TableHead>
                            <TableHead>Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={10} className="text-center py-8">Cargando...</TableCell>
                            </TableRow>
                        ) : campaignsData?.data?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="text-center py-8 text-gray-500">No se encontraron campañas</TableCell>
                            </TableRow>
                        ) : (
                            campaignsData?.data.map((campaign: any) => {
                                const dateStatus = getDateStatus(campaign.dateEvent);
                                return (
                                    <TableRow key={campaign.id} className="hover:bg-gray-50">
                                        <TableCell className="font-medium">#{campaign.id}</TableCell>
                                        <TableCell>
                                            <div className="font-medium text-gray-900">{campaign.name}</div>
                                            {campaign.description && (
                                                <div className="text-xs text-gray-500 mt-1 truncate max-w-[200px]" title={campaign.description}>
                                                    {campaign.description}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-gray-900">{formatDate(campaign.dateEvent)}</div>
                                            {dateStatus && (
                                                <div className={`text-xs ${dateStatus.class}`}>{dateStatus.text}</div>
                                            )}
                                        </TableCell>
                                        <TableCell>{campaign.address || '-'}</TableCell>
                                        <TableCell>{campaign.responsible?.name || '-'}</TableCell>
                                        <TableCell>
                                            {campaign.status ? (
                                                <Badge variant="secondary" className={getStatusClasses(campaign.status.name)}>
                                                    {campaign.status.name}
                                                </Badge>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell><MoneyDisplay value={campaign.goal} /></TableCell>
                                        <TableCell><MoneyDisplay value={campaign.estimatedBudget} /></TableCell>
                                        <TableCell>
                                            <div className="text-sm text-gray-900"><MoneyDisplay value={campaign.total_donations_amount} /></div>
                                            <div className="text-xs text-gray-500">{campaign.donations_count} donación(es)</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                <Button variant="ghost" size="sm" onClick={() => handleEdit(campaign)} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                                                    <Edit className="w-4 h-4 mr-1" /> Editar
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => setDeleteId(campaign.id.toString())} className="text-red-600 hover:text-red-800 hover:bg-red-50">
                                                    <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>

                {/* Pagination Controls - simplified for now */}
                {campaignsData?.meta && (
                    <div className="flex justify-between items-center p-4 border-t">
                        <div className="text-sm text-gray-500">
                            Mostrando {((page - 1) * parseInt(perPage)) + 1} a {Math.min(page * parseInt(perPage), campaignsData.meta.total)} de {campaignsData.meta.total} resultados
                        </div>
                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1}
                            >
                                Anterior
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(campaignsData.meta.last_page, p + 1))}
                                disabled={page >= campaignsData.meta.last_page}
                            >
                                Siguiente
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <CampaignFormModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                campaign={selectedCampaign}
                mode={modalMode}
                statusOptions={statusOptions}
                userOptions={userOptions}
            />

            <Dialog open={!!deleteId} onOpenChange={(val) => !val && setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Estás seguro?</DialogTitle>
                        <DialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente la campaña.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
