"use client"

import { useState, useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import listPlugin from "@fullcalendar/list"
import esLocale from "@fullcalendar/core/locales/es"
import { toast } from "sonner"
import { Plus, Filter, Trash2, Calendar as CalendarIcon, Clock, Tag, MapPin, AlignLeft, Info, DollarSign, Briefcase, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

export default function CalendarPage() {
    const queryClient = useQueryClient()
    const calendarRef = useRef<FullCalendar>(null)

    // --- State ---
    const [events, setEvents] = useState<any[]>([])
    const [filteredEvents, setFilteredEvents] = useState<any[]>([])
    const [activeFilter, setActiveFilter] = useState("all")

    // Modal State
    const [eventModalOpen, setEventModalOpen] = useState(false)
    const [detailsModalOpen, setDetailsModalOpen] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    // Selected Event Data
    const [selectedEventDetails, setSelectedEventDetails] = useState<any>(null)
    const [eventToDeleteId, setEventToDeleteId] = useState<number | null>(null)

    // Form Data
    const [formData, setFormData] = useState({
        id: null,
        title: "",
        description: "",
        start: "",
        end: "",
        is_all_day: false,
        color: "#3b82f6"
    })

    // --- Data Fetching ---
    const { data: fetchedEvents, isLoading } = useQuery({
        queryKey: ["calendar-events"],
        queryFn: async () => {
            const res = await fetch("/api/calendar")
            if (!res.ok) throw new Error("Failed to fetch events")
            return res.json()
        }
    })

    // Update local state when data is fetched
    useEffect(() => {
        if (fetchedEvents) {
            setEvents(fetchedEvents)
            filterEvents(activeFilter, fetchedEvents)
        }
    }, [fetchedEvents, activeFilter])

    // --- Filtering ---
    const filterEvents = (filterType: string, allEvents: any[] = events) => {
        if (filterType === "all") {
            setFilteredEvents(allEvents)
        } else {
            const filtered = allEvents.filter(evt => {
                if (filterType === 'Subscription') {
                    return evt.extendedProps.type === 'Subscription' || evt.extendedProps.type === 'Subscription Renewal';
                }
                // Handle 'Policy' filter covering both 'Policy' and 'Policy Expiry'
                if (filterType === 'Policy') {
                    return evt.extendedProps.type.startsWith('Policy');
                }
                // Handle 'Certificate' filter covering both 'Certificate' and 'Certificate Expiry'
                if (filterType === 'Certificate') {
                    return evt.extendedProps.type.startsWith('Certificate');
                }
                return evt.extendedProps.type === filterType
            })
            setFilteredEvents(filtered)
        }
    }

    const handleFilterClick = (type: string) => {
        setActiveFilter(type)
    }

    // --- Mutations ---
    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch("/api/calendar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            })
            if (!res.ok) throw new Error("Failed to create event")
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["calendar-events"] })
            toast.success("Evento creado")
            setEventModalOpen(false)
            resetForm()
        },
        onError: (err: any) => toast.error(err.message)
    })

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`/api/calendar/${data.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            })
            if (!res.ok) throw new Error("Failed to update event")
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["calendar-events"] })
            toast.success("Evento actualizado")
            setEventModalOpen(false)
            resetForm()
        },
        onError: (err: any) => toast.error(err.message)
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/calendar/${id}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Failed to delete event")
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["calendar-events"] })
            toast.success("Evento eliminado")
            setDeleteModalOpen(false)
            setEventModalOpen(false) // Close edit modal if open
            resetForm()
        },
        onError: (err: any) => toast.error(err.message)
    })

    // --- Handlers ---
    const handleDateSelect = (selectInfo: any) => {
        if (activeFilter !== "all" && activeFilter !== "Personal") {
            return // Prevent creating events when filtered to specific modules
        }

        setIsEditing(false)
        resetForm()
        const processDateStr = (str: string) => {
            if (!str) return ""
            return str.includes('T') ? str.slice(0, 16) : `${str}T09:00`
        }

        setFormData(prev => ({
            ...prev,
            start: processDateStr(selectInfo.startStr),
            end: selectInfo.endStr ? processDateStr(selectInfo.endStr) : processDateStr(selectInfo.startStr),
            is_all_day: selectInfo.allDay
        }))
        setEventModalOpen(true)
    }

    const handleEventClick = (clickInfo: any) => {
        const event = clickInfo.event
        const props = event.extendedProps

        if (props.isPersonal) {
            // Edit Personal Event
            setIsEditing(true)

            // Format dates for input (local ISO)
            const toLocalISO = (date: Date) => {
                if (!date) return ""
                const offset = date.getTimezoneOffset() * 60000
                return new Date(date.getTime() - offset).toISOString().slice(0, 16)
            }

            setFormData({
                id: event.id,
                title: event.title,
                description: props.description || "",
                start: toLocalISO(event.start),
                end: event.end ? toLocalISO(event.end) : toLocalISO(event.start),
                is_all_day: event.allDay,
                color: event.backgroundColor
            })
            setEventModalOpen(true)
        } else {
            // View Details
            setSelectedEventDetails({
                title: event.title,
                start: event.start,
                end: event.end,
                allDay: event.allDay,
                color: event.backgroundColor,
                ...props
            })
            setDetailsModalOpen(true)
        }
    }

    const handleEventDrop = (dropInfo: any) => {
        const event = dropInfo.event
        if (event.extendedProps.isPersonal) {
            // Optimistic update handled by FullCalendar, just sync backend
            updateMutation.mutate({
                id: event.id,
                title: event.title,
                description: event.extendedProps.description,
                start: event.start.toISOString(), // Send ISO
                end: event.end ? event.end.toISOString() : null,
                is_all_day: event.allDay,
                color: event.backgroundColor
            })
        } else {
            dropInfo.revert()
        }
    }

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault()
        if (isEditing) {
            updateMutation.mutate(formData)
        } else {
            createMutation.mutate(formData)
        }
    }

    const handleDelete = () => {
        if (formData.id) {
            setEventToDeleteId(formData.id)
            setDeleteModalOpen(true)
        }
    }

    const resetForm = () => {
        setFormData({
            id: null,
            title: "",
            description: "",
            start: "",
            end: "",
            is_all_day: false,
            color: "#3b82f6"
        })
    }

    // --- Render Helpers ---
    const formatDateDisplay = (date: Date) => {
        if (!date) return ''
        return date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    }

    const formatTimeDisplay = (date: Date) => {
        if (!date) return ''
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    }

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount / 100)
    }

    // Filter Button Component
    const FilterButton = ({ type, label, colorClass }: { type: string, label: string, colorClass: string }) => (
        <button
            onClick={() => handleFilterClick(type)}
            className={cn(
                "px-3 py-1 rounded-full text-sm flex items-center transition-all border",
                activeFilter === type
                    ? "bg-gray-100 ring-2 ring-offset-1 ring-blue-500 border-gray-300"
                    : "bg-white border-gray-200 hover:bg-gray-50"
            )}
        >
            <span className={cn("inline-block w-3 h-3 rounded-full mr-2", colorClass)}></span>
            {label}
        </button>
    )

    return (
        <div className="flex-1 p-6 bg-gray-50/50 h-full overflow-y-auto font-sans">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">📅 Mi Calendario</h2>
                    <p className="text-muted-foreground">Todos tus eventos, tareas, reuniones y responsabilidades en un solo lugar</p>
                </div>

                {/* Filters */}
                <div className="mb-6 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <Filter className="w-4 h-4 mr-2" /> Filtrar por tipo:
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        <FilterButton type="all" label="Todos" colorClass="bg-gradient-to-r from-blue-500 to-purple-500" />
                        <FilterButton type="Personal" label="👤 Personal" colorClass="bg-blue-500" />
                        <FilterButton type="Task" label="📋 Tareas" colorClass="bg-blue-500" />
                        <FilterButton type="Event" label="🎉 Eventos" colorClass="bg-green-500" />
                        <FilterButton type="Meeting" label="💼 Reuniones" colorClass="bg-purple-500" />
                        <FilterButton type="Project" label="🚀 Proyectos" colorClass="bg-amber-500" />
                        <FilterButton type="Campaign" label="📢 Campañas" colorClass="bg-pink-500" />
                        <FilterButton type="Subscription" label="💳 Suscripciones" colorClass="bg-cyan-500" />
                        <FilterButton type="Case" label="📁 Casos" colorClass="bg-red-500" />
                        <FilterButton type="Invoice" label="🧾 Facturas" colorClass="bg-teal-500" />
                        <FilterButton type="Certificate" label="📜 Certificados" colorClass="bg-purple-500" />
                        <FilterButton type="Induction" label="👥 Inducciones" colorClass="bg-indigo-600" />
                        <FilterButton type="Policy" label="📋 Políticas" colorClass="bg-lime-500" />
                        <FilterButton type="Social Media Post" label="📱 Redes Sociales" colorClass="bg-cyan-400" />
                        <FilterButton type="Punch Item" label="🔧 Punch List" colorClass="bg-yellow-500" />
                        <FilterButton type="Marketing Case" label="📊 Casos Marketing" colorClass="bg-rose-400" />
                    </div>
                </div>

                {/* Calendar */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg">
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        locale={esLocale}
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
                        }}
                        events={filteredEvents}
                        editable={true}
                        selectable={true}
                        selectMirror={true}
                        dayMaxEvents={true}
                        weekends={true}
                        select={handleDateSelect}
                        eventClick={handleEventClick}
                        eventDrop={handleEventDrop}
                        height="auto"
                        contentHeight={650}
                        buttonText={{
                            today: 'Hoy',
                            month: 'Mes',
                            week: 'Semana',
                            day: 'Día',
                            list: 'Lista'
                        }}
                    />
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Dialog open={eventModalOpen} onOpenChange={setEventModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Editar Evento' : 'Nuevo Evento'}</DialogTitle>
                        <DialogDescription>Complete los detalles del evento personal.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Título</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start">Inicio</Label>
                                <Input
                                    id="start"
                                    type="datetime-local"
                                    value={formData.start}
                                    onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end">Fin</Label>
                                <Input
                                    id="end"
                                    type="datetime-local"
                                    value={formData.end}
                                    onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is_all_day"
                                checked={formData.is_all_day}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_all_day: checked as boolean })}
                            />
                            <Label htmlFor="is_all_day">Todo el día</Label>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Color</Label>
                            <div className="flex gap-2">
                                {['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'].map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, color: c })}
                                        className={cn(
                                            "w-6 h-6 rounded-full focus:outline-none ring-2 ring-offset-2 ring-offset-white",
                                            formData.color === c ? "ring-gray-400" : "ring-transparent"
                                        )}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>

                        <DialogFooter>
                            {isEditing && (
                                <Button type="button" variant="destructive" onClick={handleDelete} className="mr-auto">
                                    <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                                </Button>
                            )}
                            <Button type="button" variant="outline" onClick={() => setEventModalOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                {isEditing ? 'Actualizar' : 'Guardar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eliminar Evento</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={() => eventToDeleteId && deleteMutation.mutate(eventToDeleteId)}>Eliminar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Details Modal */}
            <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedEventDetails?.color }}></span>
                            {selectedEventDetails?.title}
                        </DialogTitle>
                        <DialogDescription>Detalles completos del evento</DialogDescription>
                    </DialogHeader>

                    {selectedEventDetails && (
                        <div className="space-y-3 text-sm text-gray-600">
                            <div className="flex items-start gap-2">
                                <CalendarIcon className="w-4 h-4 mt-0.5 text-gray-500" />
                                <div>
                                    <strong className="text-gray-900 block">Fecha:</strong>
                                    {formatDateDisplay(selectedEventDetails.start)}
                                </div>
                            </div>

                            {(!selectedEventDetails.allDay && selectedEventDetails.start) && (
                                <div className="flex items-start gap-2">
                                    <Clock className="w-4 h-4 mt-0.5 text-gray-500" />
                                    <div>
                                        <strong className="text-gray-900 block">Hora:</strong>
                                        {formatTimeDisplay(selectedEventDetails.start)}
                                        {selectedEventDetails.end && ` - ${formatTimeDisplay(selectedEventDetails.end)}`}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start gap-2">
                                <Tag className="w-4 h-4 mt-0.5 text-gray-500" />
                                <div>
                                    <strong className="text-gray-900 mr-2">Tipo:</strong>
                                    {selectedEventDetails.type}
                                </div>
                            </div>

                            <div className="flex items-start gap-2">
                                <Info className="w-4 h-4 mt-0.5 text-gray-500" />
                                <div>
                                    <strong className="text-gray-900 mr-2">Estado:</strong>
                                    <span style={{ backgroundColor: selectedEventDetails.color }} className="px-2 py-0.5 rounded text-white text-xs">
                                        {selectedEventDetails.status || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            {/* Dynamic Fields */}
                            {selectedEventDetails.description && (
                                <div className="flex items-start gap-2">
                                    <AlignLeft className="w-4 h-4 mt-0.5 text-gray-500" />
                                    <div>
                                        <strong className="text-gray-900 block">Descripción:</strong>
                                        {selectedEventDetails.description}
                                    </div>
                                </div>
                            )}

                            {selectedEventDetails.project && (
                                <div className="flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-900 font-medium">Proyecto:</span> {selectedEventDetails.project}
                                </div>
                            )}

                            {selectedEventDetails.amount !== undefined && (
                                <div className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-900 font-medium">Monto:</span> {formatMoney(selectedEventDetails.amount)}
                                </div>
                            )}

                            {selectedEventDetails.location && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-900 font-medium">Ubicación:</span> {selectedEventDetails.location}
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDetailsModalOpen(false)}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
