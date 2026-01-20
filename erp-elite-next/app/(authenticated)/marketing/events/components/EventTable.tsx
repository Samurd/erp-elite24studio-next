import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import MoneyDisplay from "@/components/ui/money-display";

interface Event {
    id: number;
    name: string;
    type: {
        id: number;
        name: string;
        description: string;
        color: string;
    } | null;
    status: {
        id: number;
        name: string;
        description: string;
        color: string;
    } | null;
    eventDate: string;
    location: string;
    responsible: {
        id: number;
        name: string;
    } | null;
    eventItems?: any[]; // For total calculation
}

interface EventTableProps {
    data: Event[];
    isLoading: boolean;
    onEdit: (event: Event) => void;
    onDelete: (id: number) => void;
}

export function EventTable({ data, isLoading, onEdit, onDelete }: EventTableProps) {
    if (isLoading) {
        return <div className="text-center py-4">Cargando eventos...</div>;
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        // Handle both ISO string and date string
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        // Adjust for timezone if necessary, or just use UTC/Local
        // Ideally use date-fns or similar but standard JS for now
        // Actually the Laravel backend sends 'YYYY-MM-DD' usually for Date type
        return date.toLocaleDateString("es-CO");
    };



    const calculateTotal = (items: any[]) => {
        return items ? items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0) : 0;
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Evento</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Lugar</TableHead>
                        <TableHead>Responsable</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                                No hay eventos registrados
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((event) => (
                            <TableRow key={event.id}>
                                <TableCell>#{event.id}</TableCell>
                                <TableCell className="font-medium">{event.name}</TableCell>
                                <TableCell>{event.type?.name || "-"}</TableCell>
                                <TableCell>
                                    {event.status ? (
                                        <Badge
                                            className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-none shadow-none"
                                        >
                                            {event.status.name}
                                        </Badge>
                                    ) : (
                                        "-"
                                    )}
                                </TableCell>
                                <TableCell>{formatDate(event.eventDate)}</TableCell>
                                <TableCell>{event.location}</TableCell>
                                <TableCell>{event.responsible?.name || "-"}</TableCell>
                                <TableCell className="font-bold">
                                    <MoneyDisplay value={calculateTotal(event.eventItems || [])} />
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title="Ver Detalles"
                                            asChild
                                        >
                                            <Link href={`/marketing/events/${event.id}`}>
                                                <Eye className="h-4 w-4 text-green-600" />
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(event)}
                                            title="Editar"
                                        >
                                            <Edit className="h-4 w-4 text-blue-600" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onDelete(event.id)}
                                            title="Eliminar"
                                        >
                                            <Trash2 className="h-4 w-4 text-red-600" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
