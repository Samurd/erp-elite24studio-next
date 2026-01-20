
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { VisitFormModal } from "./VisitFormModal";
import { DateService } from "@/lib/date-service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface VisitsTabProps {
    worksiteId: number;
}

export function VisitsTab({ worksiteId }: VisitsTabProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const queryClient = useQueryClient();

    const { data: visits, isLoading } = useQuery({
        queryKey: ["worksite-visits", worksiteId],
        queryFn: async () => {
            const res = await fetch(`/api/worksites/${worksiteId}/visits`);
            if (!res.ok) throw new Error("Failed to fetch visits");
            return res.json();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/worksites/${worksiteId}/visits/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete visit");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Visita eliminada");
            queryClient.invalidateQueries({ queryKey: ["worksite-visits", worksiteId] });
        },
        onError: () => toast.error("Error al eliminar la visita"),
    });

    const handleCreate = () => {
        setSelectedItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item: any) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        if (confirm("¿Estás seguro de que deseas eliminar esta visita?")) {
            deleteMutation.mutate(id);
        }
    };

    const getStatusColor = (statusName?: string) => {
        if (!statusName) return "bg-gray-100 text-gray-800";
        const name = statusName.toLowerCase();
        if (name.includes("programada")) return "bg-blue-100 text-blue-800";
        if (name.includes("realizada")) return "bg-green-100 text-green-800";
        if (name.includes("cancelada")) return "bg-red-100 text-red-800";
        if (name.includes("postergada")) return "bg-yellow-100 text-yellow-800";
        return "bg-gray-100 text-gray-800";
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Lista de Visitas</h3>
                <Button onClick={handleCreate} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Visita
                </Button>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Visitante</TableHead>
                            <TableHead>Observaciones</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-4">
                                    Cargando...
                                </TableCell>
                            </TableRow>
                        ) : visits?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                                    No hay visitas registradas
                                </TableCell>
                            </TableRow>
                        ) : (
                            visits?.map((visit: any) => (
                                <TableRow key={visit.id}>
                                    <TableCell>{DateService.toDisplay(visit.visitDate)}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(visit.status?.name)}`}>
                                            {visit.status?.name || "Sin estado"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {visit.visitor ? (
                                            <div className="flex items-center space-x-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={visit.visitor.profilePhotoUrl} />
                                                    <AvatarFallback>{visit.visitor.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm">{visit.visitor.name}</span>
                                            </div>
                                        ) : (
                                            "-"
                                        )}
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate" title={visit.generalObservations}>
                                        {visit.generalObservations || "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end space-x-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(visit)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(visit.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <VisitFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                worksiteId={worksiteId}
                visit={selectedItem}
            />
        </div>
    );
}
