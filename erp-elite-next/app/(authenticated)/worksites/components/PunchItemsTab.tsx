
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
import { PunchItemFormModal } from "./PunchItemFormModal";
import { DateService } from "@/lib/date-service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PunchItemsTabProps {
    worksiteId: number;
}

export function PunchItemsTab({ worksiteId }: PunchItemsTabProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const queryClient = useQueryClient();

    const { data: punchItems, isLoading } = useQuery({
        queryKey: ["worksite-punch-items", worksiteId],
        queryFn: async () => {
            const res = await fetch(`/api/worksites/${worksiteId}/punch-items`);
            if (!res.ok) throw new Error("Failed to fetch punch items");
            return res.json();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/worksites/${worksiteId}/punch-items/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete punch item");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Punch Item eliminado");
            queryClient.invalidateQueries({ queryKey: ["worksite-punch-items", worksiteId] });
        },
        onError: () => toast.error("Error al eliminar el punch item"),
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
        if (confirm("¿Estás seguro de que deseas eliminar este item?")) {
            deleteMutation.mutate(id);
        }
    };

    const getStatusColor = (statusName?: string) => {
        if (!statusName) return "bg-blue-100 text-blue-800";
        const name = statusName.toLowerCase();
        if (name.includes("pendiente")) return "bg-gray-100 text-gray-800";
        if (name.includes("progreso")) return "bg-yellow-100 text-yellow-800";
        if (name.includes("completado")) return "bg-green-100 text-green-800";
        if (name.includes("cancelado")) return "bg-red-100 text-red-800";
        return "bg-blue-100 text-blue-800";
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Lista de Punch Items</h3>
                <Button onClick={handleCreate} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Item
                </Button>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Observaciones</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Responsable</TableHead>
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
                        ) : punchItems?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                                    No hay punch items registrados
                                </TableCell>
                            </TableRow>
                        ) : (
                            punchItems?.map((item: any) => (
                                <TableRow key={item.id}>
                                    <TableCell>{DateService.toDisplay(item.createdAt)}</TableCell>
                                    <TableCell className="max-w-xs truncate" title={item.observations}>
                                        {item.observations}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status?.name)}`}>
                                            {item.status?.name || "Sin estado"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {item.responsible ? (
                                            <div className="flex items-center space-x-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={item.responsible.profilePhotoUrl} />
                                                    <AvatarFallback>{item.responsible.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm">{item.responsible.name}</span>
                                            </div>
                                        ) : (
                                            "-"
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end space-x-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(item)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(item.id)}
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

            <PunchItemFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                worksiteId={worksiteId}
                punchItem={selectedItem}
            />
        </div>
    );
}
