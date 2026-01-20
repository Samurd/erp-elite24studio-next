"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { DateService } from "@/lib/date-service"
import { toast } from "sonner"
import { Search, Plus, Filter, Trash2, Edit, FileText } from "lucide-react"

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

import ReportFormModal from "./components/ReportFormModal"

export default function ReportsPage() {
    const queryClient = useQueryClient()

    // State
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState("")
    const [status, setStatus] = useState("")
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")

    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingReport, setEditingReport] = useState<any>(null)
    const [deletingReport, setDeletingReport] = useState<any>(null)

    // Data Fetching
    const { data: optionsData } = useQuery({
        queryKey: ["report-options"],
        queryFn: async () => {
            const res = await fetch("/api/reports/options")
            if (!res.ok) throw new Error("Failed to fetch options")
            return res.json()
        }
    })

    const { data: reportsData, isLoading } = useQuery({
        queryKey: ["reports", page, search, status, dateFrom, dateTo],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                per_page: "10",
                search,
                status,
                date_from: dateFrom,
                date_to: dateTo
            })
            const res = await fetch(`/api/reports?${params}`)
            if (!res.ok) throw new Error("Failed to fetch reports")
            return res.json()
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/reports/${id}`, {
                method: "DELETE"
            })
            if (!res.ok) throw new Error("Failed to delete report")
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["reports"] })
            setDeletingReport(null)
            toast.success("Reporte eliminado")
        },
        onError: (error: any) => {
            toast.error(error.message)
        }
    })

    // Handlers
    const handleEdit = (report: any) => {
        setEditingReport(report)
        setIsCreateOpen(true)
    }

    const handleDelete = () => {
        if (deletingReport) {
            deleteMutation.mutate(deletingReport.id)
        }
    }

    const handleCloseModal = () => {
        setIsCreateOpen(false)
        setEditingReport(null)
    }

    const clearFilters = () => {
        setSearch("")
        setStatus("")
        setDateFrom("")
        setDateTo("")
        setPage(1)
    }

    const statuses = optionsData?.statuses || []

    return (
        <div className="flex-1 p-8 bg-gray-50/50 h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Reportes</h1>
                    <p className="text-muted-foreground mt-1">Gestión y seguimiento de reportes.</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Reporte
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
                                placeholder="Título o descripción..."
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
                                <SelectItem value="all">Todos</SelectItem> {/* Handle "all" explicitly if needed or use empty string logic */}
                                {statuses.map((s: any) => (
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
                            <TableHead>Título</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">Cargando...</TableCell>
                            </TableRow>
                        ) : reportsData?.data?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">No se encontraron reportes</TableCell>
                            </TableRow>
                        ) : (
                            reportsData?.data?.map((report: any) => (
                                <TableRow key={report.id}>
                                    <TableCell className="font-medium">#{report.id}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{report.title}</span>
                                            <span className="text-muted-foreground text-xs truncate max-w-[300px]">
                                                {report.description}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{DateService.toDisplay(report.date)}</span>
                                            <span className="text-muted-foreground text-xs">{report.hour}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {report.status ? (
                                            <Badge variant="secondary" style={{ backgroundColor: report.status.color + '20', color: report.status.color }}>
                                                {report.status.name}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(report)}>
                                                <Edit className="h-4 w-4 text-blue-600" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setDeletingReport(report)}>
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
                {reportsData?.meta && (
                    <div className="flex items-center justify-between px-4 py-4 border-t">
                        <div className="text-sm text-muted-foreground">
                            Mostrando {((page - 1) * 10) + 1} a {Math.min(page * 10, reportsData.meta.total)} de {reportsData.meta.total} resultados
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
                                disabled={page >= reportsData.meta.last_page}
                            >
                                Siguiente
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <ReportFormModal
                open={isCreateOpen}
                onClose={handleCloseModal}
                report={editingReport}
                statusOptions={statuses}
            />

            {/* Delete Confirmation */}
            <Dialog open={!!deletingReport} onOpenChange={(val) => !val && setDeletingReport(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eliminar Reporte</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que quieres eliminar este reporte? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletingReport(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
