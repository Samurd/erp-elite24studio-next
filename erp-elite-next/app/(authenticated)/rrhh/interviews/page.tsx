
"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Calendar as CalendarIcon, List, X } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { InterviewsTable } from "./components/InterviewsTable"
import { InterviewForm } from "./components/InterviewForm"
import { Option } from "@/types"
import Link from "next/link"

export default function InterviewsPage() {
    const queryClient = useQueryClient()

    // Filters
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedInterview, setSelectedInterview] = useState<any>(null)

    // Option Fetching
    const { data: interviewTypes = [] } = useQuery<Option[]>({
        queryKey: ["interviewTypes"],
        queryFn: async () => (await fetch("/api/rrhh/options?slug=tipo_entrevista")).json()
    })

    const { data: interviewStatuses = [] } = useQuery<Option[]>({
        queryKey: ["interviewStatuses"],
        queryFn: async () => (await fetch("/api/rrhh/options?slug=estado_entrevista")).json()
    })

    const { data: interviewResults = [] } = useQuery<Option[]>({
        queryKey: ["interviewResults"],
        queryFn: async () => (await fetch("/api/rrhh/options?slug=resultado_entrevista")).json()
    })

    const { data: interviewers = [] } = useQuery<{ id: number; name: string }[]>({
        queryKey: ["interviewers"],
        queryFn: async () => (await fetch("/api/rrhh/options?slug=users")).json()
    })

    // This fetches ALL applicants for the dropdown. 
    // Optimization: Depending on number of applicants, might need search-based select or paginated fetch.
    const { data: applicants = [] } = useQuery<{ id: number; fullName: string }[]>({
        queryKey: ["all-applicants"],
        queryFn: async () => (await fetch("/api/rrhh/applicants?perPage=100")).json().then(res => res.data)
    })

    // Data Fetching
    const { data: interviewsData, isLoading } = useQuery({
        queryKey: ["interviews", search, statusFilter, dateFrom, dateTo],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (search) params.append("search", search)
            if (statusFilter !== "all") params.append("statusId", statusFilter)
            if (dateFrom) params.append("dateFrom", dateFrom)
            if (dateTo) params.append("dateTo", dateTo)

            const res = await fetch(`/api/rrhh/interviews?${params}`)
            return res.json()
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await fetch(`/api/rrhh/interviews/${id}`, { method: "DELETE" })
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["interviews"] })
    })

    const handleEdit = (interview: any) => {
        setSelectedInterview(interview)
        setIsModalOpen(true)
    }

    const handleCreate = () => {
        setSelectedInterview(null)
        setIsModalOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Entrevistas</h1>
                    <p className="text-gray-600 mt-1">Gestión y seguimiento de entrevistas</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/rrhh/interviews/calendar">
                        <Button variant="outline" className="bg-white">
                            <CalendarIcon className="mr-2 h-4 w-4" /> Calendario
                        </Button>
                    </Link>
                    <Button className="bg-yellow-600 hover:bg-yellow-700" onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Agendar Entrevista
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4 border grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Buscar por postulante o email..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        {interviewStatuses.map((s) => (
                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    placeholder="Desde"
                />
                <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    placeholder="Hasta"
                />

                {(search || statusFilter !== "all" || dateFrom || dateTo) && (
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setSearch("")
                            setStatusFilter("all")
                            setDateFrom("")
                            setDateTo("")
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        <X className="mr-2 h-4 w-4" />
                        Limpiar filtros
                    </Button>
                )}
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="text-center py-10">Cargando entrevistas...</div>
            ) : (
                <InterviewsTable
                    data={interviewsData?.data || []}
                    onEdit={handleEdit}
                    onDelete={(id) => {
                        if (confirm("¿Estás seguro de eliminar esta entrevista?")) {
                            deleteMutation.mutate(id)
                        }
                    }}
                />
            )}

            {/* Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedInterview ? "Editar Entrevista" : "Agendar Entrevista"}</DialogTitle>
                    </DialogHeader>
                    <InterviewForm
                        initialData={selectedInterview}
                        isEditing={!!selectedInterview}
                        applicants={applicants}
                        interviewers={interviewers}
                        types={interviewTypes}
                        statuses={interviewStatuses}
                        results={interviewResults}
                        onSuccess={() => setIsModalOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
