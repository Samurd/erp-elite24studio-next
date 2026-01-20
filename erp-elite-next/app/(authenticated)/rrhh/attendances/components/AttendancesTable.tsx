
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
import { Pencil, Trash, Loader2, X } from "lucide-react";
import { DateService } from "@/lib/date-service";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface AttendancesTableProps {
    onEdit: (attendance: any) => void;
    options: any;
}

export function AttendancesTable({ onEdit, options }: AttendancesTableProps) {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [modalityFilter, setModalityFilter] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const queryClient = useQueryClient();

    const fetchAttendances = async () => {
        const params = new URLSearchParams({
            view: 'daily',
            page: page.toString(),
            limit: "10",
            search,
            ...(statusFilter !== "all" && { status_filter: statusFilter }),
            ...(modalityFilter !== "all" && { modality_filter: modalityFilter }),
            ...(dateFrom && { date_from: dateFrom }),
            ...(dateTo && { date_to: dateTo }),
        });
        const res = await fetch(`/api/rrhh/attendances?${params}`);
        if (!res.ok) throw new Error("Failed to fetch attendances");
        return res.json();
    };

    const { data, isLoading, isError } = useQuery({
        queryKey: ["attendances", "daily", page, search, statusFilter, modalityFilter, dateFrom, dateTo],
        queryFn: fetchAttendances,
        placeholderData: (previousData) => previousData,
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/rrhh/attendances/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete attendance");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendances"] });
            toast.success("Éxito", { description: "Asistencia eliminada correctamente" });
        },
        onError: () => {
            toast.error("Error", { description: "No se pudo eliminar la asistencia" });
        },
    });

    const handleDelete = (id: number) => {
        if (confirm("¿Estás seguro de eliminar este registro de asistencia?")) {
            deleteMutation.mutate(id);
        }
    };

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("all");
        setModalityFilter("all");
        setDateFrom("");
        setDateTo("");
        setPage(1);
    };

    if (isError) return <div className="p-4 text-red-500">Error al cargar datos</div>;

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-white rounded-lg border shadow-sm">
                <Input
                    placeholder="Buscar empleado..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tipos</SelectItem>
                        {options?.attendanceStatusOptions?.map((status: any) => (
                            <SelectItem key={status.id} value={status.id.toString()}>
                                {status.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={modalityFilter} onValueChange={setModalityFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Modalidad" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Modalidades</SelectItem>
                        {options?.attendanceModalityOptions?.map((mod: any) => (
                            <SelectItem key={mod.id} value={mod.id.toString()}>
                                {mod.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="flex gap-2 col-span-1 md:col-span-2">
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
                    <Button variant="ghost" size="icon" onClick={clearFilters} className="text-muted-foreground hover:text-foreground border border-dashed border-gray-300">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                            <TableHead>Fecha</TableHead>
                            <TableHead>Empleado</TableHead>
                            <TableHead>Horario</TableHead>
                            <TableHead>Detalles</TableHead>
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
                                        <div className="text-sm text-gray-900">
                                            {DateService.toDisplayDate(item.date)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-gray-900">{item.employee?.fullName}</div>
                                        <div className="text-xs text-muted-foreground">{item.employee?.identificationNumber}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-gray-500">
                                            <div><span className="font-medium">Entrada:</span> {DateService.toDisplayTime(item.checkIn)}</div>
                                            <div><span className="font-medium">Salida:</span> {DateService.toDisplayTime(item.checkOut)}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            {item.modality && (
                                                <Badge variant="outline" className="bg-gray-50 text-xs">
                                                    {item.modality.name}
                                                </Badge>
                                            )}
                                            {item.observations && (
                                                <div className="text-xs text-gray-500 truncate max-w-[200px]" title={item.observations}>
                                                    {item.observations}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-100">
                                            {item.status?.name}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
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
