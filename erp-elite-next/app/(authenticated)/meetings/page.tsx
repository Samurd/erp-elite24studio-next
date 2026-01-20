"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Filter, X } from "lucide-react"
import { toast } from "sonner"
import MeetingsTable from "./components/MeetingsTable"
import MeetingFormModal from "./components/MeetingFormModal"

export default function MeetingsPage() {
    const queryClient = useQueryClient()

    // --- Filters State ---
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [teamFilter, setTeamFilter] = useState("all")
    const [goalFilter, setGoalFilter] = useState("all")
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")
    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(10)

    // --- Modal State ---
    const [modalOpen, setModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create")
    const [selectedMeeting, setSelectedMeeting] = useState<any>(null)

    // --- Data Fetching ---

    // FETCH OPTIONS
    const { data: optionsData } = useQuery({
        queryKey: ["meetings-options"],
        queryFn: async () => {
            const res = await fetch("/api/meetings/options")
            if (!res.ok) throw new Error("Failed to fetch options")
            return res.json()
        }
    })

    // FETCH MEETINGS
    const { data: meetingsData, isLoading } = useQuery({
        queryKey: ["meetings", page, perPage, search, statusFilter, teamFilter, goalFilter, dateFrom, dateTo],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                perPage: perPage.toString(),
                search,
                status_filter: statusFilter,
                team_filter: teamFilter,
                goal_filter: goalFilter,
                date_from: dateFrom,
                date_to: dateTo
            })
            const res = await fetch(`/api/meetings?${params.toString()}`)
            if (!res.ok) throw new Error("Failed to fetch meetings")
            return res.json()
        }
    })

    // DELETE MUTATION
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/meetings/${id}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Failed to delete meeting")
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["meetings"] })
            toast.success("Reunión eliminada")
        },
        onError: (err: any) => toast.error(err.message)
    })

    // --- Handlers ---
    const handleCreate = () => {
        setModalMode("create")
        setSelectedMeeting(null)
        setModalOpen(true)
    }

    const handleEdit = (meeting: any) => {
        setModalMode("edit")
        setSelectedMeeting(meeting)
        setModalOpen(true)
    }

    const handleView = (meeting: any) => {
        setModalMode("view")
        setSelectedMeeting(meeting)
        setModalOpen(true)
    }

    const handleDelete = (id: number) => {
        if (confirm("¿Estás seguro de que deseas eliminar esta reunión?")) {
            deleteMutation.mutate(id)
        }
    }

    const clearFilters = () => {
        setSearch("")
        setStatusFilter("all")
        setTeamFilter("all")
        setGoalFilter("all")
        setDateFrom("")
        setDateTo("")
        setPage(1)
    }

    return (
        <div className="flex-1 p-8 bg-gray-50/50 h-full overflow-y-auto">
            <div className="max-w-8xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center bg-white p-6 rounded-xl border shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Reuniones</h1>
                        <p className="text-muted-foreground mt-1">Gestión de reuniones y seguimiento de equipos.</p>
                    </div>
                    <Button onClick={handleCreate} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                        <Plus className="w-4 h-4 mr-2" /> Nueva Reunión
                    </Button>
                </div>

                {/* Filters */}
                <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <Filter className="w-4 h-4" /> Filtros
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Buscar por título, notas..."
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {/* Status */}
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los Estados</SelectItem>
                                {optionsData?.statusOptions?.map((status: any) => (
                                    <SelectItem key={status.id} value={status.id.toString()}>
                                        {status.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Team */}
                        <Select value={teamFilter} onValueChange={setTeamFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Equipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los Equipos</SelectItem>
                                {optionsData?.teamOptions?.map((team: any) => (
                                    <SelectItem key={team.id} value={team.id.toString()}>
                                        {team.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Goal */}
                        <Select value={goalFilter} onValueChange={setGoalFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Meta Cumplida" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="1">Sí</SelectItem>
                                <SelectItem value="0">No</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t mt-4">
                        {/* Date From */}
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-500">Desde</span>
                            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                        </div>

                        {/* Date To */}
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-500">Hasta</span>
                            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                        </div>

                        <div className="flex items-end lg:col-start-4">
                            <Button variant="outline" onClick={clearFilters} className="w-full">
                                <X className="w-4 h-4 mr-2" /> Limpiar Filtros
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Cargando reuniones...</div>
                ) : (
                    <div className="space-y-4">
                        <MeetingsTable
                            data={meetingsData?.data || []}
                            onView={handleView}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />

                        {/* Pagination */}
                        {meetingsData?.meta && (
                            <div className="flex items-center justify-between bg-white p-4 rounded-lg border shadow-sm">
                                <div className="text-sm text-gray-500">
                                    Mostrando {(meetingsData.meta.page - 1) * meetingsData.meta.pageSize + 1} a {Math.min(meetingsData.meta.page * meetingsData.meta.pageSize, meetingsData.meta.total)} de {meetingsData.meta.total} resultados
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page === 1}
                                        onClick={() => setPage(p => p - 1)}
                                    >
                                        Anterior
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page >= meetingsData.meta.lastPage}
                                        onClick={() => setPage(p => p + 1)}
                                    >
                                        Siguiente
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <MeetingFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                mode={modalMode}
                meeting={selectedMeeting}
                statusOptions={optionsData?.statusOptions || []}
                teamOptions={optionsData?.teamOptions || []}
                userOptions={optionsData?.userOptions || []}
            />
        </div>
    )
}
