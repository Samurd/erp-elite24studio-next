'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface SocialMediaPost {
    id: number;
    pieceName: string;
    mediums: string | null;
    contentType: string | null;
    scheduledDate: string | null;
    status: {
        id: number;
        name: string;
        color?: string; // Assuming color might be added later or mapped
    };
    responsible: {
        id: number;
        name: string;
    } | null;
    project: {
        id: number;
        name: string;
    } | null;
}

interface SocialMediaTableProps {
    data: SocialMediaPost[];
    onEdit: (post: SocialMediaPost) => void;
    onDelete: (id: number) => void;
}

export default function SocialMediaTable({ data, onEdit, onDelete }: SocialMediaTableProps) {
    const getStatusColor = (statusName: string) => {
        switch (statusName) {
            case 'Publicado': return 'bg-green-100 text-green-800';
            case 'En Progreso':
            case 'Programado': return 'bg-blue-100 text-blue-800';
            case 'Borrador':
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
                        <TableHead>Pieza / Nombre</TableHead>
                        <TableHead>Medios</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha Prog.</TableHead>
                        <TableHead>Proyecto</TableHead>
                        <TableHead>Responsable</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                No se encontraron publicaciones
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((post) => (
                            <TableRow key={post.id}>
                                <TableCell>#{post.id}</TableCell>
                                <TableCell className="font-medium">{post.pieceName}</TableCell>
                                <TableCell>{post.mediums || '-'}</TableCell>
                                <TableCell>{post.contentType || '-'}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className={getStatusColor(post.status?.name || '')}>
                                        {post.status?.name || '-'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {post.scheduledDate ? format(new Date(post.scheduledDate), "P", { locale: es }) : '-'}
                                </TableCell>
                                <TableCell>{post.project?.name || '-'}</TableCell>
                                <TableCell>{post.responsible?.name || '-'}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => onEdit(post)}>
                                            <Edit className="h-4 w-4 text-blue-600" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => onDelete(post.id)}>
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
