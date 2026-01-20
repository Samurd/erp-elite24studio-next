
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
import { Pencil, Trash, Eye, Loader2, X } from "lucide-react";
import { DateService } from "@/lib/date-service";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface HolidaysTableProps {
    onEdit: (holiday: any) => void;
    onView: (holiday: any) => void;
}

export function HolidaysTable({ onEdit, onView }: HolidaysTableProps) {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [year, setYear] = useState<string>(new Date().getFullYear().toString());

    const queryClient = useQueryClient();

    // Fetch Options for Filter
    const { data: options } = useQuery({
        queryKey: ["rrhh-options"],
        queryFn: async () => {
            const res = await fetch("/api/rrhh/options?slug=tipo_vacacion"); // Using slug that triggers holiday options too based on our API mod
            return res.json();
        }
    });

    const fetchHolidays = async () => {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: "10",
            search,
            ...(typeFilter !== "all" && { type_filter: typeFilter }),
            ...(statusFilter !== "all" && { status_filter: statusFilter }),
            ...(year && { year }),
        });
        const res = await fetch(`/api/rrhh/holidays?${params}`);
        if (!res.ok) throw new Error("Failed to fetch holidays");
        return res.json();
    };

    const { data, isLoading, isError } = useQuery({
        queryKey: ["holidays", page, search, typeFilter, statusFilter, year],
        queryFn: fetchHolidays,
        placeholderData: (previousData) => previousData,
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/rrhh/holidays/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete holiday");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["holidays"] });
            toast.success("Éxito", { description: "Solicitud eliminada correctamente" });
        },
        onError: () => {
            toast.error("Error", { description: "No se pudo eliminar la solicitud" });
        },
    });

    const handleDelete = (id: number) => {
        if (confirm("¿Estás seguro de eliminar esta solicitud?")) {
            deleteMutation.mutate(id);
        }
    };

    const getDuration = (start: string, end: string) => {
        if (!start || !end) return '-';
        const s = new Date(start);
        const e = new Date(end);
        const diffTime = Math.abs(e.getTime() - s.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return `${diffDays} días`;
    };

    const clearFilters = () => {
        setSearch("");
        setTypeFilter("all");
        setStatusFilter("all");
        setYear(new Date().getFullYear().toString());
        setPage(1);
    };

    if (isError) return <div className="p-4 text-red-500">Error al cargar datos</div>;

    const yearOptions = Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 5 + i);

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-white rounded-lg border shadow-sm">
                <Input
                    placeholder="Buscar por empleado..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full"
                />
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Tipo Ausencia" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tipos</SelectItem>
                        {options?.holidayTypeOptions?.map((type: any) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                                {type.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Estados</SelectItem>
                        {options?.holidayStatusOptions?.map((status: any) => (
                            <SelectItem key={status.id} value={status.id.toString()}>
                                {status.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={year} onValueChange={setYear}>
                    <SelectTrigger>
                        <SelectValue placeholder="Año" />
                    </SelectTrigger>
                    <SelectContent>
                        {yearOptions.map((y) => (
                            <SelectItem key={y} value={y.toString()}>
                                {y}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground hover:text-foreground border border-dashed border-gray-300">
                    <X className="h-4 w-4 mr-2" />
                    Limpiar
                </Button>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                            <TableHead>Empleado</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Fechas</TableHead>
                            <TableHead>Duración</TableHead>
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
                                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                            {item.type?.name}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-gray-700">
                                            {DateService.toDisplayDate(item.startDate)}
                                            <span className="text-gray-400 mx-1">a</span>
                                            {DateService.toDisplayDate(item.endDate)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getDuration(item.startDate, item.endDate)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100">
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
