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
import { Edit2, Trash2, Calendar, User } from "lucide-react";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { useState } from "react";
import { DateService } from "@/lib/date-service";

interface Birthday {
    id: number;
    date: string;
    whatsapp?: string | null;
    comments?: string | null;
    employee?: {
        id: number;
        fullName: string;
    } | null;
    contact?: {
        id: number;
        name: string;
    } | null;
    responsible?: {
        id: number;
        name: string;
    } | null;
    employeeId?: number | null;
    contactId?: number | null;
}

interface BirthdaysTableProps {
    data: Birthday[];
    onEdit: (birthday: Birthday) => void;
    onDelete: (id: number) => void;
    currentPage: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void;
}

export function BirthdaysTable({
    data,
    onEdit,
    onDelete,
    currentPage,
    totalPages,
    totalItems,
    onPageChange
}: BirthdaysTableProps) {
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const handleDelete = async () => {
        if (deleteId) {
            onDelete(deleteId);
            setDeleteId(null);
        }
    };

    const formatDate = (date: string) => {
        return DateService.toDisplayDate(date);
    };

    const getName = (birthday: Birthday) => {
        if (birthday.employee) return birthday.employee.fullName;
        if (birthday.contact) return birthday.contact.name;
        return '-';
    };

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Responsable</TableHead>
                            <TableHead>WhatsApp</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-900">{getName(item)}</span>
                                        {item.comments && (
                                            <span className="text-xs text-gray-500">{item.comments}</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {item.employeeId ? (
                                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                            Empleado
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                            Contacto
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(item.date)}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                        <User className="h-3 w-3" />
                                        {item.responsible?.name || 'Sin asignar'}
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm text-gray-500">
                                    {item.whatsapp || '-'}
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
                                    No se encontraron cumpleaños.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
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
                    onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    Siguiente
                </Button>
            </div>

            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Eliminar Cumpleaños"
                description="¿Estás seguro de que deseas eliminar este cumpleaños? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="destructive"
            />
        </>
    );
}
