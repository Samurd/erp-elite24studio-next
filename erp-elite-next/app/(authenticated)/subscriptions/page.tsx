"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { toast } from "sonner"
import { Search, Plus, Filter, Trash2, Edit } from "lucide-react"

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

import MoneyDisplay from "@/components/ui/money-display"
import SubscriptionFormModal from "./components/SubscriptionFormModal"

export default function SubscriptionsPage() {
    const queryClient = useQueryClient()

    // State
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState("")
    const [status, setStatus] = useState("")
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")

    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingSubscription, setEditingSubscription] = useState<any>(null)
    const [deletingSubscription, setDeletingSubscription] = useState<any>(null)

    // Data Fetching
    const { data: optionsData } = useQuery({
        queryKey: ["subscription-options"],
        queryFn: async () => {
            const res = await fetch("/api/subscriptions/options")
            if (!res.ok) throw new Error("Failed to fetch options")
            return res.json()
        }
    })

    const { data: subscriptionsData, isLoading } = useQuery({
        queryKey: ["subscriptions", page, search, status, dateFrom, dateTo],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                per_page: "10",
                search,
                status,
                date_from: dateFrom,
                date_to: dateTo
            })
            const res = await fetch(`/api/subscriptions?${params}`)
            if (!res.ok) throw new Error("Failed to fetch subscriptions")
            return res.json()
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/subscriptions/${id}`, {
                method: "DELETE"
            })
            if (!res.ok) throw new Error("Failed to delete subscription")
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subscriptions"] })
            setDeletingSubscription(null)
            toast.success("Suscripción eliminada")
        },
        onError: (error: any) => {
            toast.error(error.message)
        }
    })

    // Handlers
    const handleEdit = (subscription: any) => {
        setEditingSubscription(subscription)
        setIsCreateOpen(true)
    }

    const handleDelete = () => {
        if (deletingSubscription) {
            deleteMutation.mutate(deletingSubscription.id)
        }
    }

    const handleCloseModal = () => {
        setIsCreateOpen(false)
        setEditingSubscription(null)
    }

    const clearFilters = () => {
        setSearch("")
        setStatus("")
        setDateFrom("")
        setDateTo("")
        setPage(1)
    }

    const statusOptions = optionsData?.statusOptions || []
    const frequencyOptions = optionsData?.frequencyOptions || []

    return (
        <div className="flex-1 p-8 bg-gray-50/50 h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Suscripciones</h1>
                    <p className="text-muted-foreground mt-1">Gestión de suscripciones y subcontratos.</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                    <Plus className="mr-2 h-4 w-4" /> Nueva Suscripción
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Búsqueda</label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Nombre..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Estado</label>
                        <Select value={status} onValueChange={setStatus}>
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
                        <label className="text-sm font-medium">Desde</label>
                        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Hasta</label>
                        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    </div>

                    <div className="flex items-end">
                        <Button variant="outline" onClick={clearFilters} className="w-full">
                            <Filter className="mr-2 h-4 w-4" /> Limpiar
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">ID</TableHead>
                            <TableHead>Nombre / Tipo</TableHead>
                            <TableHead>Frecuencia</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>Fechas</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">Cargando...</TableCell>
                            </TableRow>
                        ) : subscriptionsData?.data?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">No se encontraron suscripciones</TableCell>
                            </TableRow>
                        ) : (
                            subscriptionsData?.data?.map((sub: any) => {
                                // Manual matching if API doesn't return joined objects yet
                                const subStatus = sub.status || statusOptions.find((s: any) => s.id === sub.statusId)
                                const subFrequency = sub.frequency || frequencyOptions.find((f: any) => f.id === sub.frequencyId)

                                return (
                                    <TableRow key={sub.id}>
                                        <TableCell className="font-medium">#{sub.id}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{sub.name}</span>
                                                <span className="text-muted-foreground text-xs">{sub.type}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {subFrequency ? (
                                                <Badge variant="outline" className="bg-gray-50">
                                                    {subFrequency.name}
                                                </Badge>
                                            ) : "-"}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <MoneyDisplay value={sub.amount} />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-sm">
                                                <span className="text-gray-900">Inicio: {sub.startDate ? format(new Date(sub.startDate), "dd/MM/yyyy") : "-"}</span>
                                                <span className="text-muted-foreground text-xs">Renovación: {sub.renewalDate ? format(new Date(sub.renewalDate), "dd/MM/yyyy") : "-"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {subStatus ? (
                                                <Badge variant="secondary" style={{ backgroundColor: subStatus.color ? subStatus.color + '20' : '#e5e7eb', color: subStatus.color || '#374151' }}>
                                                    {subStatus.name}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(sub)}>
                                                    <Edit className="h-4 w-4 text-blue-600" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setDeletingSubscription(sub)}>
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                {subscriptionsData?.meta && (
                    <div className="flex items-center justify-between px-4 py-4 border-t">
                        <div className="text-sm text-muted-foreground">
                            Mostrando {((page - 1) * 10) + 1} a {Math.min(page * 10, subscriptionsData.meta.total)} de {subscriptionsData.meta.total} resultados
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
                                disabled={page >= subscriptionsData.meta.last_page}
                            >
                                Siguiente
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <SubscriptionFormModal
                open={isCreateOpen}
                onClose={handleCloseModal}
                subscription={editingSubscription}
                statusOptions={statusOptions}
                frequencyOptions={frequencyOptions}
            />

            {/* Delete Confirmation */}
            <Dialog open={!!deletingSubscription} onOpenChange={(val) => !val && setDeletingSubscription(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eliminar Suscripción</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que quieres eliminar esta suscripción? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletingSubscription(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
