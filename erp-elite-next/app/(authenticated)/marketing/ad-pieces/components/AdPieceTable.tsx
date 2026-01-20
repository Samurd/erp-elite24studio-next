'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Link as LinkIcon, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AdPiece {
    id: number;
    name: string;
    media: string | null;
    type: {
        id: number;
        name: string;
        color?: string;
    } | null;
    format: {
        id: number;
        name: string;
        color?: string;
    } | null;
    status: {
        id: number;
        name: string;
        color?: string;
    } | null;
    project: {
        id: number;
        name: string;
    } | null;
    team: {
        id: number;
        name: string;
    } | null;
    strategy: {
        id: number;
        name: string;
    } | null;
}

interface AdPieceTableProps {
    data: AdPiece[];
    onEdit: (data: AdPiece) => void;
    onDelete: (id: number) => void;
}

export default function AdPieceTable({ data, onEdit, onDelete }: AdPieceTableProps) {
    const getStatusColor = (statusName: string) => {
        switch (statusName) {
            case 'Completado': return 'bg-green-100 text-green-800';
            case 'En Proceso': return 'bg-blue-100 text-blue-800';
            case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
            case 'Cancelado': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Medio</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Formato</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Proyecto</TableHead>
                        <TableHead>Equipo</TableHead>
                        <TableHead>Estrategia</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                                No se encontraron piezas publicitarias
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>#{item.id}</TableCell>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>{item.media || '-'}</TableCell>
                                <TableCell>{item.type?.name || '-'}</TableCell>
                                <TableCell>{item.format?.name || '-'}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className={getStatusColor(item.status?.name || '')}>
                                        {item.status?.name || '-'}
                                    </Badge>
                                </TableCell>
                                <TableCell>{item.project?.name || '-'}</TableCell>
                                <TableCell>{item.team?.name || '-'}</TableCell>
                                <TableCell>{item.strategy?.name || '-'}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                                            <Edit className="h-4 w-4 text-blue-600" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}>
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
