"use client";

import React, { useState, use } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, Plus, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination-component";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";
import MoneyDisplay from "@/components/ui/money-display";
import { RichSelect } from "@/components/ui/rich-select";
import { EventFormModal } from "../components/EventFormModal";
import { EventItemFormModal } from "../components/EventItemFormModal";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    // Item Filters
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState("10");
    const [unitFilter, setUnitFilter] = useState("");

    const debouncedSearch = useDebounce(search, 500);

    // Modals State
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    // Fetch Options
    const { data: options } = useQuery({
        queryKey: ["marketing", "events", "options"],
        queryFn: async () => {
            const res = await fetch("/api/marketing/events/options");
            if (!res.ok) throw new Error("Failed to fetch options");
            return res.json();
        },
    });

    // Fetch Event Details
    const { data: event, isLoading: isLoadingEvent, refetch: refetchEvent } = useQuery({
        queryKey: ["marketing", "events", id],
        queryFn: async () => {
            const res = await fetch(`/api/marketing/events/${id}`);
            if (!res.ok) throw new Error("Failed to fetch event");
            return res.json();
        },
    });

    // Fetch Items
    const { data: itemsData, isLoading: isLoadingItems, refetch: refetchItems } = useQuery({
        queryKey: ["marketing", "events", id, "items", page, debouncedSearch, unitFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                perPage,
                search: debouncedSearch,
                unitFilter,
            });
            const res = await fetch(`/api/marketing/events/${id}/items?${params}`);
            if (!res.ok) throw new Error("Failed to fetch items");
            return res.json();
        },
    });

    const handleDeleteItem = async (itemId: number) => {
        if (!confirm("¿Estás seguro de que quieres eliminar este ítem?")) return;
        try {
            const res = await fetch(`/api/marketing/events/${id}/items/${itemId}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Item deletion failed");
            toast.success("Ítem eliminado correctamente");
            refetchItems();
        } catch (e) {
            console.error(e);
            toast.error("No se pudo eliminar el ítem");
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString("es-CO");
    };



    if (isLoadingEvent) return <div className="p-6">Cargando evento...</div>;
    if (!event) return <div className="p-6">Evento no encontrado</div>;

    return (
        <div className="space-y-6">
            {/* Header & Event Details */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <Link href="/marketing/events" className="text-yellow-600 hover:underline mb-2 inline-flex items-center">
                            <ArrowLeft className="w-4 h-4 mr-1" /> Volver a Eventos
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-800 mt-2">{event.name}</h1>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            {event.status && (
                                <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-none">
                                    {event.status.name}
                                </Badge>
                            )}
                            <span>{formatDate(event.eventDate)}</span>
                            <span className="flex items-center"><i className="fas fa-map-marker-alt mr-1"></i> {event.location}</span>
                        </div>
                    </div>
                    <Button onClick={() => setIsEventModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                        <Edit className="w-4 h-4 mr-2" /> Editar Evento
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t pt-4">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Tipo</h3>
                        <p className="mt-1 text-gray-900">{event.type?.name || '-'}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Responsable</h3>
                        <p className="mt-1 text-gray-900">{event.responsible?.name || '-'}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Archivos Adjuntos</h3>
                        <div className="mt-1">
                            {event.files && event.files.length > 0 ? (
                                <ul className="space-y-1">
                                    {event.files.map((file: any) => (
                                        <li key={file.id}>
                                            <a href={`/storage/${file.path}`} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2 text-sm">
                                                <Paperclip className="w-3 h-3" /> {file.name}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 text-sm">No hay archivos adjuntos.</p>
                            )}
                        </div>
                    </div>
                    {event.observations && (
                        <div className="col-span-full">
                            <h3 className="text-sm font-medium text-gray-500">Observaciones</h3>
                            <p className="mt-1 text-gray-900 whitespace-pre-wrap">{event.observations}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Items Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Ítems / Presupuesto</h2>
                    <Button onClick={() => { setEditingItem(null); setIsItemModalOpen(true); }} className="bg-yellow-600 hover:bg-yellow-700">
                        <Plus className="w-4 h-4 mr-2" /> Agregar Ítem
                    </Button>
                </div>

                {/* Items Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Input
                        placeholder="Buscar ítem..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <RichSelect
                        options={options?.units || []}
                        value={unitFilter}
                        onValueChange={setUnitFilter}
                        placeholder="Todas las unidades"
                    />
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Cantidad</TableHead>
                                <TableHead>Unidad</TableHead>
                                <TableHead>Vr. Unitario</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {itemsData?.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-4 text-gray-500">No hay ítems registrados</TableCell>
                                </TableRow>
                            ) : (
                                itemsData?.data.map((item: any) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>{item.unit?.name || '-'}</TableCell>
                                        <TableCell>
                                            <MoneyDisplay value={item.unitPrice} />
                                        </TableCell>
                                        <TableCell className="font-bold">
                                            <MoneyDisplay value={item.totalPrice} />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                <Button variant="ghost" size="icon" onClick={() => { setEditingItem(item); setIsItemModalOpen(true); }} title="Editar">
                                                    <Edit className="w-4 h-4 text-blue-600" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)} title="Eliminar">
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {itemsData && (
                    <div className="mt-4">
                        <Pagination
                            currentPage={page}
                            totalPages={itemsData.totalPages}
                            onPageChange={setPage}
                            totalItems={itemsData.total}
                        />
                    </div>
                )}
            </div>

            {/* Edit Event Modal */}
            <EventFormModal
                open={isEventModalOpen}
                onOpenChange={setIsEventModalOpen}
                eventToEdit={event}
                onSuccess={refetchEvent}
                typeOptions={options?.types || []}
                statusOptions={options?.statuses || []}
                responsibleOptions={options?.responsibles || []}
            />

            {/* Create/Edit Item Modal */}
            <EventItemFormModal
                open={isItemModalOpen}
                onOpenChange={setIsItemModalOpen}
                eventId={parseInt(id)}
                itemToEdit={editingItem}
                onSuccess={refetchItems}
                unitOptions={options?.units || []}
                eventName={event.name}
            />
        </div>
    );
}
