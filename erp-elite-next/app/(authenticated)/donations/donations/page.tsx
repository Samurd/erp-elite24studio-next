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
import { Plus, Search, Filter, X, Pencil, Trash2 } from "lucide-react"
import { useDebounce } from "../../../../hooks/use-debounce"
import DonationFormModal from "./components/DonationFormModal"
import MoneyDisplay from "@/components/ui/money-display"
import { DateService } from "@/lib/date-service"

// Helper for date formatting
const formatDate = (dateString: string | undefined | null) => {
    return DateService.toDisplay(dateString)
};

export default function DonationsList() {
    const queryClient = useQueryClient()
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState("")
    const [campaignFilter, setCampaignFilter] = useState("all")
    const [paymentMethodFilter, setPaymentMethodFilter] = useState("all")
    const [certifiedFilter, setCertifiedFilter] = useState("all")
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedDonation, setSelectedDonation] = useState<any>(null)
    const [mode, setMode] = useState<"create" | "edit">("create")

    const debouncedSearch = useDebounce(search, 300)

    // Fetch Options
    const { data: optionsData } = useQuery({
        queryKey: ["donations-options"],
        queryFn: async () => {
            const res = await fetch("/api/donations/donations/options")
            if (!res.ok) throw new Error("Failed to fetch options")
            return res.json()
        }
    })

    const campaigns = optionsData?.campaigns || []
    const paymentMethods = optionsData?.paymentMethods || []

    // Fetch Donations
    const { data: donationsData, isLoading } = useQuery({
        queryKey: ["donations", page, debouncedSearch, campaignFilter, paymentMethodFilter, certifiedFilter, dateFrom, dateTo],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                per_page: "10",
            })
            if (debouncedSearch) params.append("search", debouncedSearch)
            if (campaignFilter && campaignFilter !== "all") params.append("campaign_filter", campaignFilter)
            if (paymentMethodFilter && paymentMethodFilter !== "all") params.append("payment_method_filter", paymentMethodFilter)
            if (certifiedFilter && certifiedFilter !== "all") params.append("certified_filter", certifiedFilter)
            if (dateFrom) params.append("date_from", dateFrom)
            if (dateTo) params.append("date_to", dateTo)

            const res = await fetch(`/api/donations/donations?${params.toString()}`)
            if (!res.ok) throw new Error("Failed to fetch donations")
            return res.json()
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/donations/donations/${id}`, {
                method: "DELETE",
            })
            if (!res.ok) throw new Error("Failed to delete donation")
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["donations"] })
            toast.success("Donación eliminada")
        },
        onError: (error: any) => {
            toast.error(error.message)
        }
    })

    const handleCreate = () => {
        setSelectedDonation(null)
        setMode("create")
        setIsFormOpen(true)
    }

    const handleEdit = (donation: any) => {
        setSelectedDonation(donation)
        setMode("edit")
        setIsFormOpen(true)
    }

    const handleDelete = (id: number) => {
        if (confirm("¿Estás seguro de eliminar esta donación?")) {
            deleteMutation.mutate(id)
        }
    }

    const clearFilters = () => {
        setSearch("")
        setCampaignFilter("all")
        setPaymentMethodFilter("all")
        setCertifiedFilter("all")
        setDateFrom("")
        setDateTo("")
        setPage(1)
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Donaciones</h1>
                    <p className="text-muted-foreground">Gestión de donaciones y recaudos.</p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Donación
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label>Búsqueda</Label>
                        <Input
                            placeholder="Buscar donante..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Campaña</Label>
                        <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Campaña" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas las campañas</SelectItem>
                                {campaigns.map((c: any) => (
                                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {/* <div className="space-y-2">
                        <Label>Método de Pago</Label>
                        <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Método de Pago" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {paymentMethods.map((m: string) => (
                                    <SelectItem key={m} value={m}>{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div> */}
                    <div className="space-y-2">
                        <Label>Certificado</Label>
                        <Select value={certifiedFilter} onValueChange={setCertifiedFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Certificado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="1">Sí</SelectItem>
                                <SelectItem value="0">No</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Fecha Desde</Label>
                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            placeholder="Desde"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Fecha Hasta</Label>
                        <Input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            placeholder="Hasta"
                        />
                    </div>
                    <div className="flex items-end">
                        <Button variant="outline" onClick={clearFilters} className="w-full">
                            <X className="mr-2 h-4 w-4" />
                            Limpiar
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border-0">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Donante</TableHead>
                            <TableHead>Campaña</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>Método</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Certificado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8">Cargando...</TableCell>
                            </TableRow>
                        ) : donationsData?.data?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No se encontraron donaciones</TableCell>
                            </TableRow>
                        ) : (
                            donationsData?.data?.map((donation: any) => (
                                <TableRow key={donation.id}>
                                    <TableCell>#{donation.id}</TableCell>
                                    <TableCell className="font-medium">{donation.name}</TableCell>
                                    <TableCell>{donation.campaign ? donation.campaign.name : '-'}</TableCell>
                                    <TableCell>
                                        <MoneyDisplay value={donation.amount} />
                                    </TableCell>
                                    <TableCell>{donation.paymentMethod}</TableCell>
                                    <TableCell>{formatDate(donation.date)}</TableCell>
                                    <TableCell>
                                        {donation.certified ? (
                                            <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">Sí</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-gray-500">No</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(donation)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(donation.id)}>
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
            {donationsData?.meta && (
                <div className="flex justify-between items-center text-sm text-gray-500">
                    <div>
                        Mostrando {((page - 1) * donationsData.meta.per_page) + 1} a {Math.min(page * donationsData.meta.per_page, donationsData.meta.total)} de {donationsData.meta.total} resultados
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
                            onClick={() => setPage(p => Math.min(donationsData.meta.last_page, p + 1))}
                            disabled={page >= donationsData.meta.last_page}
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
            )}

            <DonationFormModal
                open={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                donation={selectedDonation}
                mode={mode}
                campaignOptions={campaigns}
            />
        </div>
    )
}
