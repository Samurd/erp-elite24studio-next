
"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Plus, List } from "lucide-react"
import Link from "next/link"
import { InterviewsCalendar } from "../components/InterviewsCalendar"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { InterviewForm } from "../components/InterviewForm"
import { Option } from "@/types"

export default function InterviewsCalendarPage() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null)

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

    const { data: applicants = [] } = useQuery<{ id: number; fullName: string }[]>({
        queryKey: ["all-applicants"],
        queryFn: async () => (await fetch("/api/rrhh/applicants?perPage=100")).json().then(res => res.data)
    })

    // Fetch Events
    const { data: events = [], isLoading } = useQuery({
        queryKey: ["calendar-events"],
        queryFn: async () => (await fetch("/api/rrhh/interviews/calendar")).json()
    })

    // Fetch Single Interview for Editing
    const { data: selectedInterview } = useQuery({
        queryKey: ["interview", selectedInterviewId],
        queryFn: async () => {
            if (!selectedInterviewId) return null
            return (await fetch(`/api/rrhh/interviews/${selectedInterviewId}`)).json()
        },
        enabled: !!selectedInterviewId
    })

    const handleEventClick = (id: string) => {
        setSelectedInterviewId(id)
        setIsModalOpen(true)
    }

    const handleCreate = () => {
        setSelectedInterviewId(null)
        setIsModalOpen(true)
    }

    // Reset selected ID when modal closes
    const handleModalChange = (open: boolean) => {
        setIsModalOpen(open)
        if (!open) setSelectedInterviewId(null)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Calendario de Entrevistas</h1>
                    <p className="text-gray-600 mt-1">Vista mensual y semanal de entrevistas programadas</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/rrhh/interviews">
                        <Button variant="outline" className="bg-white">
                            <List className="mr-2 h-4 w-4" /> Vista Lista
                        </Button>
                    </Link>
                    <Button className="bg-yellow-600 hover:bg-yellow-700" onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Agendar Entrevista
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-10">Cargando calendario...</div>
            ) : (
                <InterviewsCalendar events={events} onEventClick={handleEventClick} />
            )}

            {/* Modal */}
            <Dialog open={isModalOpen} onOpenChange={handleModalChange}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedInterviewId ? "Editar Entrevista" : "Agendar Entrevista"}</DialogTitle>
                    </DialogHeader>
                    {/* Only render form if not loading selected interview (or if creating) */}
                    {(selectedInterview || !selectedInterviewId) && (
                        <InterviewForm
                            initialData={selectedInterview}
                            isEditing={!!selectedInterviewId}
                            applicants={applicants}
                            interviewers={interviewers}
                            types={interviewTypes}
                            statuses={interviewStatuses}
                            results={interviewResults}
                            onSuccess={() => setIsModalOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
