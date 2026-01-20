
"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Pencil, Trash, Eye, Loader2 } from "lucide-react";
import { DateService } from "@/lib/date-service";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";


interface OffboardingTableProps {
    onEdit: (offboarding: any) => void;
    onView: (offboarding: any) => void;
}

export function OffboardingTable({ onEdit, onView }: OffboardingTableProps) {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const queryClient = useQueryClient();
    // const { token } = useAuth(); // Removed

    // Fetch Options for Filter
    const { data: options } = useQuery({
        queryKey: ["rrhh-options"],
        queryFn: async () => {
            const res = await fetch("/api/rrhh/options?slug=estado_offboarding");
            return res.json();
        }
    });

    const fetchOffboardings = async () => {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: "10",
            search,
            ...(statusFilter !== "all" && { status_filter: statusFilter }),
            ...(dateFrom && { date_from: dateFrom }),
            ...(dateTo && { date_to: dateTo }),
        });
        const res = await fetch(`/api/rrhh/offboardings?${params}`);
        if (!res.ok) throw new Error("Failed to fetch offboardings");
        return res.json();
    };

    const { data, isLoading, isError } = useQuery({
        queryKey: ["offboardings", page, search, statusFilter, dateFrom, dateTo],
        queryFn: fetchOffboardings,
        placeholderData: (previousData) => previousData,
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/rrhh/offboardings/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete offboarding");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["offboardings"] });
            toast.success("Éxito", { description: "Proceso eliminado correctamente" });
        },
        onError: () => {
            toast.error("Error", { description: "No se pudo eliminar el proceso" });
        },
    });

    const handleDelete = (id: number) => {
        if (confirm("¿Estás seguro de eliminar este proceso?")) {
            deleteMutation.mutate(id);
        }
    };

    if (isError) return <div className="p-4 text-red-500">Error al cargar datos</div>;

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white rounded-lg border shadow-sm">
                <Input
                    placeholder="Buscar por empleado o proyecto..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        {options?.offboardingStatusOptions?.map((status: any) => (
                            <SelectItem key={status.id} value={status.id.toString()}>
                                {status.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full"
                />
                <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full"
                />
            </div>

            {(search || statusFilter !== "all" || dateFrom || dateTo) && (
                <div className="flex justify-end px-1">
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setSearch("");
                            setStatusFilter("all");
                            setDateFrom("");
                            setDateTo("");
                            setPage(1);
                        }}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        Limpiar filtros
                    </Button>
                </div>
            )}

            {/* Table */}
            <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                            <TableHead>Empleado</TableHead>
                            <TableHead>Proyecto / Razón</TableHead>
                            <TableHead>Fecha Salida</TableHead>
                            <TableHead>Responsable</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : data?.data?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No se encontraron resultados
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.data?.map((item: any) => (
                                <TableRow key={item.id} className="hover:bg-gray-50/50">
                                    <TableCell>
                                        <div className="font-medium text-gray-900">{item.employee?.fullName}</div>
                                        <div className="text-xs text-muted-foreground">{item.employee?.identificationNumber}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-gray-900">{item.project?.name || "N/A"}</div>
                                        <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={item.reason}>
                                            {item.reason}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {DateService.toDisplayDate(item.exitDate)}
                                    </TableCell>
                                    <TableCell>
                                        {item.responsible?.name || "Sin asignar"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-red-50 text-red-700 hover:bg-red-100 border-red-100">
                                            {item.status?.name}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => onView(item)}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" onClick={() => onEdit(item)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(item.id)}>
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {data?.meta && (
                <div className="flex items-center justify-between px-2">
                    <div className="text-sm text-muted-foreground">
                        Mostrando {((page - 1) * 10) + 1} a {Math.min(page * 10, data.meta.total)} de {data.meta.total} resultados
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page >= data.meta.last_page}
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
