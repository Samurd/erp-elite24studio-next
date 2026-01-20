'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DateService } from "@/lib/date-service";

interface CaseMarketing {
    id: number;
    subject: string;
    type: {
        id: number;
        name: string;
        color?: string;
    } | null;
    status: {
        id: number;
        name: string;
        color?: string;
    } | null;
    date: string | null;
    mediums: string | null;
    project: {
        id: number;
        name: string;
    } | null;
    responsible: {
        id: number;
        name: string;
    } | null;
}

interface CaseTableProps {
    data: CaseMarketing[];
    onEdit: (data: CaseMarketing) => void;
    onDelete: (id: number) => void;
}

export default function CaseTable({ data, onEdit, onDelete }: CaseTableProps) {
    const getStatusColor = (statusName: string) => {
        switch (statusName) {
            case 'Completado': return 'bg-green-100 text-green-800';
            case 'En Progreso': return 'bg-blue-100 text-blue-800';
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
                        <TableHead>Asunto</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Medios</TableHead>
                        <TableHead>Proyecto</TableHead>
                        <TableHead>Responsable</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                No se encontraron casos
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>#{item.id}</TableCell>
                                <TableCell className="font-medium">{item.subject}</TableCell>
                                <TableCell>{item.type?.name || '-'}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className={getStatusColor(item.status?.name || '')}>
                                        {item.status?.name || '-'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {DateService.toDisplay(item.date)}
                                </TableCell>
                                <TableCell>{item.mediums || '-'}</TableCell>
                                <TableCell>{item.project?.name || '-'}</TableCell>
                                <TableCell>{item.responsible?.name || '-'}</TableCell>
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
