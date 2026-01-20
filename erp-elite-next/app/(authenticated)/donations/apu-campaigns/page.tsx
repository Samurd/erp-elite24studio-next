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
import ApuCampaignFormModal from "./components/ApuCampaignFormModal"
import MoneyDisplay from "@/components/ui/money-display"
import { RichSelect } from "@/components/ui/rich-select"

export default function ApuCampaignsPage() {
    const queryClient = useQueryClient()
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState("")
    const [campaignFilter, setCampaignFilter] = useState("all")
    const [unitFilter, setUnitFilter] = useState("all")

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedApu, setSelectedApu] = useState<any>(null)
    const [mode, setMode] = useState<"create" | "edit">("create")

    const debouncedSearch = useDebounce(search, 300)

    // Fetch Options
    const { data: optionsData } = useQuery({
        queryKey: ["apu-campaigns-options"],
        queryFn: async () => {
            const res = await fetch("/api/donations/apu-campaigns/options")
            if (!res.ok) throw new Error("Failed to fetch options")
            return res.json()
        }
    })

    const campaignOptions = optionsData?.campaignOptions || []
    const unitOptions = optionsData?.unitOptions || []

    // Fetch APU Campaigns
    const { data: apuData, isLoading } = useQuery({
        queryKey: ["apu-campaigns", page, debouncedSearch, campaignFilter, unitFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                per_page: "10",
            })
            if (debouncedSearch) params.append("search", debouncedSearch)
            if (campaignFilter && campaignFilter !== "all") params.append("campaign_filter", campaignFilter)
            if (unitFilter && unitFilter !== "all") params.append("unit_filter", unitFilter)

            const res = await fetch(`/api/donations/apu-campaigns?${params.toString()}`)
            if (!res.ok) throw new Error("Failed to fetch APU campaigns")
            return res.json()
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/donations/apu-campaigns/${id}`, {
                method: "DELETE",
            })
            if (!res.ok) throw new Error("Failed to delete record")
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["apu-campaigns"] })
            toast.success("Registro eliminado")
        },
        onError: (error: any) => {
            toast.error(error.message)
        }
    })

    const handleCreate = () => {
        setSelectedApu(null)
        setMode("create")
        setIsFormOpen(true)
    }

    const handleEdit = (apu: any) => {
        setSelectedApu(apu)
        setMode("edit")
        setIsFormOpen(true)
    }

    const handleDelete = (id: number) => {
        if (confirm("¿Estás seguro de eliminar este registro?")) {
            deleteMutation.mutate(id)
        }
    }

    const clearFilters = () => {
        setSearch("")
        setCampaignFilter("all")
        setUnitFilter("all")
        setPage(1)
    }

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">APU Campañas</h1>
                    <p className="text-muted-foreground">Gestión de Análisis de Precios Unitarios por Campaña</p>
                </div>
                <Button onClick={handleCreate} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo APU
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label>Búsqueda</Label>
                        <Input
                            placeholder="Descripción del item..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Campaña</Label>
                        <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                {campaignOptions.map((c: any) => (
                                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Unidad</Label>

                        <RichSelect
                            value={unitFilter === "all" ? undefined : parseInt(unitFilter)}
                            onValueChange={(val) => setUnitFilter(val ? val.toString() : "all")}
                            options={unitOptions}
                            placeholder="Todas"
                            showAvatar={false}
                        />
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
                            <TableHead>Campaña</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Cantidad</TableHead>
                            <TableHead>Unidad</TableHead>
                            <TableHead>Valor Unitario</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">Cargando...</TableCell>
                            </TableRow>
                        ) : apuData?.data?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No se encontraron registros</TableCell>
                            </TableRow>
                        ) : (
                            apuData?.data?.map((item: any) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium whitespace-nowrap">{item.campaign?.name || '-'}</TableCell>
                                    <TableCell>{item.description}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>
                                        {item.unit ? (
                                            <Badge
                                                variant="secondary"
                                                style={{
                                                    backgroundColor: item.unit.color + '20',
                                                    color: item.unit.color
                                                }}
                                            >
                                                {item.unit.name}
                                            </Badge>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell><MoneyDisplay value={item.unitPrice} /></TableCell>
                                    <TableCell className="font-bold"><MoneyDisplay value={item.totalPrice} /></TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleEdit(item)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(item.id)}>
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
            {apuData?.meta && (
                <div className="flex justify-between items-center text-sm text-gray-500">
                    <div>
                        Mostrando {((page - 1) * apuData.meta.per_page) + 1} a {Math.min(page * apuData.meta.per_page, apuData.meta.total)} de {apuData.meta.total} resultados
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
                            onClick={() => setPage(p => Math.min(apuData.meta.last_page, p + 1))}
                            disabled={page >= apuData.meta.last_page}
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
            )}

            <ApuCampaignFormModal
                open={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                apuCampaign={selectedApu}
                mode={mode}
                campaigns={campaignOptions}
                unitOptions={unitOptions}
            />
        </div>
    )
}
