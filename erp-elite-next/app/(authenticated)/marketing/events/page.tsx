"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { Pagination } from "@/components/ui/pagination-component";
import { toast } from "sonner";
import { RichSelect } from "@/components/ui/rich-select";

import { EventTable } from "./components/EventTable";
import { EventFormModal } from "./components/EventFormModal";

export default function EventsPage() {
    // Filters
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState("10");
    const [typeFilter, setTypeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [responsibleFilter, setResponsibleFilter] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const debouncedSearch = useDebounce(search, 500);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<any>(null);

    // Fetch Options
    const { data: options } = useQuery({
        queryKey: ["marketing", "events", "options"],
        queryFn: async () => {
            const res = await fetch("/api/marketing/events/options");
            if (!res.ok) throw new Error("Failed to fetch options");
            return res.json();
        },
    });

    // Fetch Events
    const { data: eventsData, isLoading, refetch } = useQuery({
        queryKey: [
            "marketing",
            "events",
            page,
            perPage,
            debouncedSearch,
            typeFilter,
            statusFilter,
            responsibleFilter,
            dateFrom,
            dateTo,
        ],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                perPage,
                search: debouncedSearch,
                type_filter: typeFilter,
                status_filter: statusFilter,
                responsible_filter: responsibleFilter,
                date_from: dateFrom,
                date_to: dateTo,
            });
            const res = await fetch(`/api/marketing/events?${params}`);
            if (!res.ok) throw new Error("Failed to fetch events");
            return res.json();
        },
    });

    const handleCreate = () => {
        setEditingEvent(null);
        setIsModalOpen(true);
    };

    const handleEdit = (event: any) => {
        setEditingEvent(event);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Estás seguro de que quieres eliminar este evento?")) return;

        try {
            const res = await fetch(`/api/marketing/events/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Error deleting event");

            toast.success("Evento eliminado correctamente");
            refetch();
        } catch (error) {
            console.error(error);
            toast.error("No se pudo eliminar el evento");
        }
    };

    const clearFilters = () => {
        setSearch("");
        setTypeFilter("");
        setStatusFilter("");
        setResponsibleFilter("");
        setDateFrom("");
        setDateTo("");
        setPage(1);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Eventos de Marketing</h1>
                    <p className="text-gray-600 mt-1">Gestión de eventos, logística y presupuesto</p>
                </div>
                <Button onClick={handleCreate} className="bg-yellow-600 hover:bg-yellow-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Evento
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Búsqueda</label>
                        <Input
                            placeholder="Nombre o lugar..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Tipo</label>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL_TYPES">Todos</SelectItem> {/* Workaround for clearing Select? Or handle empty string */}
                                {options?.types.map((t: any) => (
                                    <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Estado</label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL_STATUSES">Todos</SelectItem>
                                {options?.statuses.map((s: any) => (
                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Responsable</label>
                        <RichSelect
                            options={options?.responsibles || []}
                            value={responsibleFilter}
                            onValueChange={setResponsibleFilter}
                            placeholder="Todos"
                            imageKey="profile_photo_url"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Fecha Desde</label>
                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Fecha Hasta</label>
                        <Input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                    </div>

                    <div className="flex items-end">
                        <Button variant="secondary" onClick={clearFilters} className="w-full">
                            Limpiar Filtros
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <EventTable
                    data={eventsData?.data || []}
                    isLoading={isLoading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />

                {eventsData && (
                    <div className="mt-4">
                        <Pagination
                            currentPage={page}
                            totalPages={eventsData.totalPages}
                            onPageChange={setPage}
                            totalItems={eventsData.total}
                        />
                    </div>
                )}
            </div>

            <EventFormModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                eventToEdit={editingEvent}
                onSuccess={refetch}
                typeOptions={options?.types || []}
                statusOptions={options?.statuses || []}
                responsibleOptions={options?.responsibles || []}
            />
        </div>
    );
}
