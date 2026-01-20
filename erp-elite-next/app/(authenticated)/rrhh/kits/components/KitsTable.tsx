
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
import { Edit2, Trash2, Calendar, User, Package } from "lucide-react";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { useState } from "react";

interface Kit {
    id: number;
    recipientName: string;
    recipientRole: string;
    positionArea: string;
    kitType?: string | null;
    kitContents?: string | null;
    requestDate: string;
    deliveryDate?: string | null;
    status?: {
        id: number;
        name: string;
        color?: string;
    } | null;
    requestedByUser?: {
        id: number;
        name: string;
    } | null;
    deliveryResponsibleUser?: {
        id: number;
        name: string;
    } | null;
    observations?: string | null;
}

interface KitsTableProps {
    data: Kit[];
    onEdit: (kit: Kit) => void;
    onDelete: (id: number) => void;
    currentPage: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void;
}

export function KitsTable({
    data,
    onEdit,
    onDelete,
    currentPage,
    totalPages,
    totalItems,
    onPageChange
}: KitsTableProps) {
    const [deleteId, setDeleteId] = useState<number | null>(null);

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
                            <TableHead>Destinatario</TableHead>
                            <TableHead>Detalles Kit</TableHead>
                            <TableHead>Fechas</TableHead>
                            <TableHead>Responsables</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-900">{item.recipientName}</span>
                                        <span className="text-xs text-muted-foreground">{item.recipientRole}</span>
                                        <span className="text-xs text-gray-400">{item.positionArea}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col max-w-[200px]">
                                        <div className="flex items-center gap-1 font-medium text-sm text-gray-800">
                                            <Package className="h-3 w-3" />
                                            {item.kitType || 'N/A'}
                                        </div>
                                        {item.kitContents && (
                                            <span className="text-xs text-gray-500 truncate" title={item.kitContents}>
                                                {item.kitContents}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col text-sm text-gray-500 gap-1">
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold text-xs text-muted-foreground w-8">Sol:</span>
                                            <Calendar className="h-3 w-3" /> {new Date(item.requestDate).toLocaleDateString()}
                                        </div>
                                        {item.deliveryDate && (
                                            <div className="flex items-center gap-1">
                                                <span className="font-semibold text-xs text-muted-foreground w-8">Ent:</span>
                                                <Calendar className="h-3 w-3" /> {new Date(item.deliveryDate).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1 text-xs">
                                        {item.requestedByUser && (
                                            <div className="flex items-center gap-1 text-gray-600" title="Solicitó">
                                                <User className="h-3 w-3" />
                                                <span>Sol: {item.requestedByUser.name}</span>
                                            </div>
                                        )}
                                        {item.deliveryResponsibleUser && (
                                            <div className="flex items-center gap-1 text-gray-600" title="Entregó">
                                                <User className="h-3 w-3" />
                                                <span>Ent: {item.deliveryResponsibleUser.name}</span>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {item.status && (
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                            {item.status.name}
                                        </Badge>
                                    )}
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
                                    No se encontraron kits.
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
                title="Eliminar Kit"
                description="¿Estás seguro de que deseas eliminar este kit? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="destructive"
            />
        </>
    );
}
