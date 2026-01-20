"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Filter, Briefcase, Users, X } from "lucide-react"
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
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { VacanciesTable } from "./components/VacanciesTable"
import { ApplicantsTable } from "./components/ApplicantsTable"
import { VacancyForm } from "./components/VacancyForm"
import { ApplicantForm } from "./components/ApplicantForm"
interface Option {
    id: number | string
    name: string
    [key: string]: any
}

export default function VacanciesPage() {
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState<'vacancies' | 'applicants'>('vacancies')

    // Filters
    const [vacancySearch, setVacancySearch] = useState("")
    const [contractTypeFilter, setContractTypeFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")

    const [applicantSearch, setApplicantSearch] = useState("")
    const [applicantStatusFilter, setApplicantStatusFilter] = useState("all")
    const [vacancyFilter, setVacancyFilter] = useState<string | null>(null)

    // Modal State
    const [isVacancyModalOpen, setIsVacancyModalOpen] = useState(false)
    const [selectedVacancy, setSelectedVacancy] = useState<any>(null)
    const [isApplicantModalOpen, setIsApplicantModalOpen] = useState(false)
    const [selectedApplicant, setSelectedApplicant] = useState<any>(null)

    // Fetch Options
    const { data: contractTypes = [] } = useQuery<Option[]>({
        queryKey: ["contractTypes"],
        queryFn: async () => {
            const res = await fetch("/api/rrhh/options?slug=tipo_contrato")
            return res.json()
        }
    })

    const { data: vacancyStatuses = [] } = useQuery<Option[]>({
        queryKey: ["vacancyStatuses"],
        queryFn: async () => {
            const res = await fetch("/api/rrhh/options?slug=estado_vacante")
            return res.json()
        }
    })

    const { data: applicantStatuses = [] } = useQuery<Option[]>({
        queryKey: ["applicantStatuses"],
        queryFn: async () => {
            const res = await fetch("/api/rrhh/options?slug=estado_postulante")
            return res.json()
        }
    })

    const { data: rrhhUsers = [] } = useQuery<{ id: string; name: string; email: string; profilePhotoPath?: string }[]>({
        queryKey: ["rrhhUsers"],
        queryFn: async () => {
            // console.log("Fetching RRHH users...")
            const res = await fetch("/api/rrhh/options?slug=users")
            const data = await res.json()
            // console.log("RRHH Users fetched:", data)
            return data
        }
    })

    // Fetch Data
    const { data: vacanciesData, isLoading: vacanciesLoading } = useQuery({
        queryKey: ["vacancies", vacancySearch, contractTypeFilter, statusFilter],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (vacancySearch) params.append("search", vacancySearch)
            if (contractTypeFilter !== "all") params.append("contractTypeId", contractTypeFilter)
            if (statusFilter !== "all") params.append("statusId", statusFilter)

            const res = await fetch(`/api/rrhh/vacancies?${params}`)
            return res.json()
        }
    })

    const { data: applicantsData, isLoading: applicantsLoading } = useQuery({
        queryKey: ["applicants", applicantSearch, applicantStatusFilter, vacancyFilter],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (applicantSearch) params.append("search", applicantSearch)
            if (applicantStatusFilter !== "all") params.append("statusId", applicantStatusFilter)
            if (vacancyFilter) params.append("vacancyId", vacancyFilter)

            const res = await fetch(`/api/rrhh/applicants?${params}`)
            return res.json()
        }
    })

    const deleteVacancyMutation = useMutation({
        mutationFn: async (id: number) => {
            await fetch(`/api/rrhh/vacancies/${id}`, { method: "DELETE" })
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vacancies"] })
    })

    // Handlers
    const handleCreateVacancy = () => {
        setSelectedVacancy(null)
        setIsVacancyModalOpen(true)
    }

    const handleEditVacancy = async (vacancy: any) => {
        // Fetch full vacancy data with relations
        const res = await fetch(`/api/rrhh/vacancies/${vacancy.id}`)
        const fullData = await res.json()
        // console.log('Full vacancy data loaded:', fullData)
        setSelectedVacancy(fullData)
        setIsVacancyModalOpen(true)
    }

    const handleCreateApplicant = () => {
        setSelectedApplicant(null)
        setIsApplicantModalOpen(true)
    }

    const handleEditApplicant = (applicant: any) => {
        setSelectedApplicant(applicant)
        setIsApplicantModalOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Vacantes y Selección</h1>
                    <p className="text-gray-600 mt-1">Gestión de oportunidades y postulantes</p>
                </div>
                <div>
                    {activeTab === 'vacancies' ? (
                        <Button className="bg-yellow-600 hover:bg-yellow-700" onClick={handleCreateVacancy}>
                            <Plus className="mr-2 h-4 w-4" /> Nueva Vacante
                        </Button>
                    ) : (
                        <Button className="bg-yellow-600 hover:bg-yellow-700" onClick={handleCreateApplicant}>
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Postulante
                        </Button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 bg-white rounded-t-lg px-4 pt-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('vacancies')}
                        className={`${activeTab === 'vacancies'
                            ? 'border-yellow-500 text-yellow-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                        <Briefcase className="mr-2 h-4 w-4" /> Vacantes
                    </button>
                    <button
                        onClick={() => setActiveTab('applicants')}
                        className={`${activeTab === 'applicants'
                            ? 'border-yellow-500 text-yellow-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                        <Users className="mr-2 h-4 w-4" /> Postulantes
                    </button>
                </nav>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">

                {/* Sidebar */}
                <div className="w-full lg:w-1/4 bg-white rounded-lg shadow-sm p-4 h-fit border">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Vacantes Activas</h3>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        <button
                            onClick={() => { setVacancyFilter(null); setActiveTab('applicants'); }}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${!vacancyFilter ? 'bg-yellow-50 text-yellow-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Todas las vacantes
                        </button>
                        {vacanciesData?.data?.map((v: any) => (
                            <button
                                key={v.id}
                                onClick={() => { setVacancyFilter(v.id.toString()); setActiveTab('applicants'); }}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex justify-between items-center ${vacancyFilter === v.id.toString() ? 'bg-yellow-50 text-yellow-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                <span className="truncate">{v.title}</span>
                                <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs ml-2">{v.applicants_count || 0}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="w-full lg:w-3/4 space-y-4">

                    {activeTab === 'vacancies' && (
                        <>
                            {/* Vacancies Filters */}
                            <div className="bg-white rounded-lg shadow-sm p-4 border grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Buscar vacante..."
                                        className="pl-9"
                                        value={vacancySearch}
                                        onChange={(e) => setVacancySearch(e.target.value)}
                                    />
                                </div>
                                <Select value={contractTypeFilter} onValueChange={setContractTypeFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todas los contratos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas los contratos</SelectItem>
                                        {contractTypes.map((t) => (
                                            <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todos los estados" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los estados</SelectItem>
                                        {vacancyStatuses.map((s) => (
                                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Vacancies Table */}
                            {vacanciesLoading ? (
                                <div className="text-center py-10">Cargando vacantes...</div>
                            ) : (
                                <VacanciesTable
                                    data={vacanciesData?.data || []}
                                    onDelete={(id) => {
                                        if (confirm("¿Estás seguro de eliminar esta vacante?")) {
                                            deleteVacancyMutation.mutate(id)
                                        }
                                    }}
                                    onEdit={handleEditVacancy}
                                />
                            )}
                        </>
                    )}

                    {activeTab === 'applicants' && (
                        <>
                            {/* Applicants Filters */}
                            <div className="bg-white rounded-lg shadow-sm p-4 border grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Buscar postulante..."
                                        className="pl-9"
                                        value={applicantSearch}
                                        onChange={(e) => setApplicantSearch(e.target.value)}
                                    />
                                </div>
                                <Select value={applicantStatusFilter} onValueChange={setApplicantStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todos los estados" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los estados</SelectItem>
                                        {applicantStatuses.map((s) => (
                                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {vacancyFilter && (
                                <div className="bg-yellow-50 text-yellow-800 px-4 py-2 rounded-md flex items-center w-fit text-sm">
                                    Filtrado por vacante
                                    <button onClick={() => setVacancyFilter(null)} className="ml-2 hover:text-yellow-600">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            )}

                            {/* Applicants Table */}
                            {applicantsLoading ? (
                                <div className="text-center py-10">Cargando postulantes...</div>
                            ) : (
                                <ApplicantsTable
                                    data={applicantsData?.data || []}
                                    onEdit={handleEditApplicant}
                                />
                            )}
                        </>
                    )}

                </div>
            </div>

            {/* Vacancy Modal */}
            <Dialog open={isVacancyModalOpen} onOpenChange={setIsVacancyModalOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{selectedVacancy ? "Editar Vacante" : "Nueva Vacante"}</DialogTitle>
                        <DialogDescription>
                            {selectedVacancy ? "Modifica los detalles de la vacante existente." : "Completa el formulario para crear una nueva vacante."}
                        </DialogDescription>
                    </DialogHeader>
                    <VacancyForm
                        initialData={selectedVacancy}
                        isEditing={!!selectedVacancy}
                        contractTypes={contractTypes}
                        statuses={vacancyStatuses}
                        rrhhUsers={rrhhUsers}
                        onSuccess={() => setIsVacancyModalOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Applicant Modal */}
            <Dialog open={isApplicantModalOpen} onOpenChange={setIsApplicantModalOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{selectedApplicant ? "Editar Postulante" : "Nuevo Postulante"}</DialogTitle>
                    </DialogHeader>
                    <ApplicantForm
                        initialData={selectedApplicant}
                        isEditing={!!selectedApplicant}
                        vacancies={vacanciesData?.data || []} // Use full list if possible
                        statuses={applicantStatuses}
                        onSuccess={() => setIsApplicantModalOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
