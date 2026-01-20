
"use client";

import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, Calendar, Clock } from "lucide-react";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { useState } from "react";
import { DateService } from "@/lib/date-service";

interface Induction {
    id: number;
    employee: {
        id: number;
        fullName: string;
        // avatar?
    };
    responsible?: {
        id: number;
        name: string;
    } | null;
    status?: {
        name: string;
        color?: string; // assuming tags might have color in future
    } | null;
    confirmation?: {
        name: string;
    } | null;
    typeBond?: {
        name: string;
    } | null;
    entryDate: string;
    date?: string | null;
    duration?: string | null;
    observations?: string | null;
}

interface InductionsTableProps {
    data: Induction[];
    onEdit: (induction: Induction) => void;
    onDelete: (id: number) => void;
}

export function InductionsTable({ data, onEdit, onDelete }: InductionsTableProps) {
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const totalPages = Math.ceil(data.length / itemsPerPage);
    const paginatedData = data.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleDelete = async () => {
        if (deleteId) {
            onDelete(deleteId);
            setDeleteId(null);
        }
    };

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Empleado</TableHead>
                            <TableHead>Fechas</TableHead>
                            <TableHead>Responsable</TableHead>
                            <TableHead>Estado / Confirmación</TableHead>
                            <TableHead>Duración</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-900">{item.employee?.fullName}</span>
                                        <span className="text-xs text-muted-foreground">{item.typeBond?.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col text-sm text-gray-500 gap-1">
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold text-xs text-muted-foreground w-14">Ingreso:</span>
                                            <Calendar className="h-3 w-3" /> {DateService.toDisplayDate(item.entryDate)}
                                        </div>
                                        {item.date && (
                                            <div className="flex items-center gap-1">
                                                <span className="font-semibold text-xs text-muted-foreground w-14">Inducción:</span>
                                                <Calendar className="h-3 w-3" /> {DateService.toDisplayDate(item.date)}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {item.responsible?.name || <span className="text-muted-foreground italic">Sin asignar</span>}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1 items-start">
                                        {item.status && (
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                {item.status.name}
                                            </Badge>
                                        )}
                                        {item.confirmation && (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                {item.confirmation.name}
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {item.duration ? (
                                        <div className="flex items-center gap-1 text-sm text-gray-600">
                                            <Clock className="h-3 w-3" />
                                            {item.duration.substring(0, 5)} hs
                                        </div>
                                    ) : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onEdit(item)}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                            <span className="sr-only">Editar</span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDeleteId(item.id)}
                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Eliminar</span>
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No se encontraron inducciones.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        Anterior
                    </Button>
                    <div className="text-sm font-medium">
                        Página {currentPage} de {totalPages}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        Siguiente
                    </Button>
                </div>
            )}

            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Eliminar Inducción"
                description="¿Estás seguro de que deseas eliminar esta inducción? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="destructive"
            />
        </>
    );
}
