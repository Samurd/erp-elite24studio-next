"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Plus, X, Pencil, Trash2 } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import AllianceFormModal from "./components/AllianceFormModal"
import { DateService } from "@/lib/date-service"

export default function AlliancesPage() {
    const queryClient = useQueryClient()
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState("")
    const [typeFilter, setTypeFilter] = useState("all")
    const [certifiedFilter, setCertifiedFilter] = useState("all")
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedAlliance, setSelectedAlliance] = useState<any>(null)
    const [mode, setMode] = useState<"create" | "edit">("create")

    const debouncedSearch = useDebounce(search, 300)

    // Fetch Options
    const { data: optionsData } = useQuery({
        queryKey: ["alliances-options"],
        queryFn: async () => {
            const res = await fetch("/api/donations/alliances/options")
            if (!res.ok) throw new Error("Failed to fetch options")
            return res.json()
        }
    })

    const typeOptions = optionsData?.typeOptions || []

    // Fetch Alliances
    const { data: alliancesData, isLoading } = useQuery({
        queryKey: ["alliances", page, debouncedSearch, typeFilter, certifiedFilter, dateFrom, dateTo],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                per_page: "10",
            })
            if (debouncedSearch) params.append("search", debouncedSearch)
            if (typeFilter && typeFilter !== "all") params.append("type_filter", typeFilter)
            if (certifiedFilter && certifiedFilter !== "all") params.append("certified_filter", certifiedFilter)
            if (dateFrom) params.append("date_from", dateFrom)
            if (dateTo) params.append("date_to", dateTo)

            const res = await fetch(`/api/donations/alliances?${params.toString()}`)
            if (!res.ok) throw new Error("Failed to fetch alliances")
            return res.json()
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/donations/alliances/${id}`, {
                method: "DELETE",
            })
            if (!res.ok) throw new Error("Failed to delete alliance")
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["alliances"] })
            toast.success("Alianza eliminada")
        },
        onError: (error: any) => {
            toast.error(error.message)
        }
    })

    const handleCreate = () => {
        setSelectedAlliance(null)
        setMode("create")
        setIsFormOpen(true)
    }

    const handleEdit = (alliance: any) => {
        setSelectedAlliance(alliance)
        setMode("edit")
        setIsFormOpen(true)
    }

    const handleDelete = (id: number) => {
        if (confirm("¿Estás seguro de eliminar esta alianza?")) {
            deleteMutation.mutate(id)
        }
    }

    const clearFilters = () => {
        setSearch("")
        setTypeFilter("all")
        setCertifiedFilter("all")
        setDateFrom("")
        setDateTo("")
        setPage(1)
    }

    const formatDate = (dateString: string | null) => {
        return DateService.toDisplay(dateString)
    }

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Alianzas</h1>
                    <p className="text-muted-foreground">Gestión de alianzas estratégicas</p>
                </div>
                <Button onClick={handleCreate} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Alianza
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label>Búsqueda</Label>
                        <Input
                            placeholder="Nombre de la alianza..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Tipo</Label>
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
                        <Label>Certificado</Label>
                        <Select value={certifiedFilter} onValueChange={setCertifiedFilter}>
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
                    <div className="space-y-2">
                        <Label>Fecha Inicio Desde</Label>
                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Fecha Inicio Hasta</Label>
                        <Input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                    </div>
                    <div className="flex items-end lg:col-span-3">
                        {/* Empty filler if needed or button here */}
                    </div>

                    <div className="flex items-end">
                        <Button variant="outline" onClick={clearFilters} className="w-full">
                            <X className="mr-2 h-4 w-4" />
                            Limpiar Filtros
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border-0">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Tipo de Alianza</TableHead>
                            <TableHead>Fecha Inicio</TableHead>
                            <TableHead>Vigencia (Meses)</TableHead>
                            <TableHead>Certificado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">Cargando...</TableCell>
                            </TableRow>
                        ) : alliancesData?.data?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No se encontraron alianzas</TableCell>
                            </TableRow>
                        ) : (
                            alliancesData?.data?.map((alliance: any) => (
                                <TableRow key={alliance.id}>
                                    <TableCell className="font-medium">{alliance.name}</TableCell>
                                    <TableCell>
                                        {alliance.type ? (
                                            <Badge
                                                variant="secondary"
                                                style={{
                                                    backgroundColor: alliance.type.color + '20',
                                                    color: alliance.type.color
                                                }}
                                            >
                                                {alliance.type.name}
                                            </Badge>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell>{formatDate(alliance.startDate)}</TableCell>
                                    <TableCell>{alliance.validity || '-'}</TableCell>
                                    <TableCell>
                                        {alliance.certified ? (
                                            <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">Sí</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-gray-500">No</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleEdit(alliance)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(alliance.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {alliancesData?.meta && (
                <div className="flex justify-between items-center text-sm text-gray-500">
                    <div>
                        Mostrando {((page - 1) * alliancesData.meta.per_page) + 1} a {Math.min(page * alliancesData.meta.per_page, alliancesData.meta.total)} de {alliancesData.meta.total} resultados
                    </div>
                    <div className="flex gap-2">
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
                            onClick={() => setPage(p => Math.min(alliancesData.meta.last_page, p + 1))}
                            disabled={page >= alliancesData.meta.last_page}
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
            )}

            <AllianceFormModal
                open={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                alliance={selectedAlliance}
                mode={mode}
                typeOptions={typeOptions}
            />
        </div>
    )
}
