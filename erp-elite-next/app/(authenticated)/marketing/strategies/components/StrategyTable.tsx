'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { DateService } from "@/lib/date-service";

interface StrategyTableProps {
    data: any[];
    onEdit: (strategy: any) => void;
    onDelete: (id: number) => void;
}

export default function StrategyTable({ data, onEdit, onDelete }: StrategyTableProps) {
    const getStatusColor = (statusName: string) => {
        switch (statusName) {
            case 'Activa': return 'bg-green-100 text-green-800';
            case 'En Progreso': return 'bg-blue-100 text-blue-800';
            case 'Pausada': return 'bg-yellow-100 text-yellow-800';
            case 'Completada': return 'bg-purple-100 text-purple-800';
            case 'Cancelada': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString: string) => {
        return DateService.toDisplay(dateString);
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Objetivo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fechas</TableHead>
                        <TableHead>Público Objetivo</TableHead>
                        <TableHead>Plataformas</TableHead>
                        <TableHead>Responsable</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={9} className="h-24 text-center">
                                No se encontraron estrategias.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((strategy) => (
                            <TableRow key={strategy.id}>
                                <TableCell>#{strategy.id}</TableCell>
                                <TableCell className="font-medium">{strategy.name}</TableCell>
                                <TableCell className="max-w-[200px] truncate" title={strategy.objective}>
                                    {strategy.objective || '-'}
                                </TableCell>
                                <TableCell>
                                    {strategy.status ? (
                                        <Badge variant="outline" className={`border-0 ${getStatusColor(strategy.status.name)}`}>
                                            {strategy.status.name}
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {strategy.startDate && strategy.endDate ? (
                                        <div className="flex flex-col text-xs">
                                            <span>{formatDate(strategy.startDate)}</span>
                                            <span className="text-muted-foreground">al {formatDate(strategy.endDate)}</span>
                                        </div>
                                    ) : (
                                        '-'
                                    )}
                                </TableCell>
                                <TableCell>{strategy.targetAudience || '-'}</TableCell>
                                <TableCell>{strategy.platforms || '-'}</TableCell>
                                <TableCell>{strategy.responsible?.name || '-'}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => onEdit(strategy)} title="Editar">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => onDelete(strategy.id)} title="Eliminar" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                            <Trash2 className="h-4 w-4" />
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
