
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ChangeFormModal } from "./ChangeFormModal";
import { DateService } from "@/lib/date-service";

interface ChangesTabProps {
    worksiteId: number;
}

export function ChangesTab({ worksiteId }: ChangesTabProps) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedChange, setSelectedChange] = useState<any>(undefined);

    const { data: changes, isLoading, refetch } = useQuery({
        queryKey: ["worksite-changes", worksiteId],
        queryFn: async () => {
            const res = await fetch(`/api/worksites/${worksiteId}/changes`);
            if (!res.ok) throw new Error("Failed to fetch changes");
            return res.json();
        },
    });

    const handleEdit = (change: any) => {
        setSelectedChange(change);
        setIsFormOpen(true);
    };

    const handleCreate = () => {
        setSelectedChange(undefined);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Estás seguro de que deseas eliminar este cambio?")) return;

        try {
            const res = await fetch(`/api/worksites/${worksiteId}/changes/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete");
            toast.success("Cambio eliminado exitosamente");
            refetch();
        } catch (error) {
            toast.error("Error al eliminar el cambio");
        }
    };

    const getStatusColor = (statusName?: string) => {
        if (!statusName) return "bg-gray-100 text-gray-800";
        const name = statusName.toLowerCase();
        if (name.includes("aprobado")) return "bg-green-100 text-green-800";
        if (name.includes("pendiente") || name.includes("revisión")) return "bg-yellow-100 text-yellow-800";
        if (name.includes("rechazado")) return "bg-red-100 text-red-800";
        return "bg-gray-100 text-gray-800";
    };



    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Historial de Cambios</h3>
                <Button onClick={handleCreate} size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Cambio
                </Button>
            </div>

            <div className="bg-white rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Impacto</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Aprobado Por</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                    Cargando...
                                </TableCell>
                            </TableRow>
                        ) : changes?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No hay cambios registrados
                                </TableCell>
                            </TableRow>
                        ) : (
                            changes?.map((change: any) => (
                                <TableRow key={change.id}>
                                    <TableCell>{DateService.toDisplay(change.changeDate)}</TableCell>
                                    <TableCell>{change.type?.name || "-"}</TableCell>
                                    <TableCell className="max-w-xs truncate" title={change.description}>
                                        {change.description}
                                    </TableCell>
                                    <TableCell>{change.budgetImpact?.name || "-"}</TableCell>
                                    <TableCell>
                                        {change.status && (
                                            <Badge
                                                variant="secondary"
                                                className={getStatusColor(change.status.name)}
                                            >
                                                {change.status.name}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {change.approver?.name || "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(change)}
                                            >
                                                <Pencil className="h-4 w-4 text-yellow-600" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(change.id)}
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

            <ChangeFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                worksiteId={worksiteId}
                change={selectedChange}
            />
        </div>
    );
}
