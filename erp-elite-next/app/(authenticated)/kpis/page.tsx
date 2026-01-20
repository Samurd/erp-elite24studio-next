
"use client";

import React, { useState } from "react";
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
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Eye, Plus, Trash2, Edit } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/pagination-component";
import { Badge } from "@/components/ui/badge";
import { KpiFormModal } from "./components/KpiFormModal";
import { RichSelect } from "@/components/ui/rich-select";
import { DateService } from "@/lib/date-service";

interface Kpi {
    id: number;
    protocolCode: string;
    indicatorName: string;
    targetValue: number | null;
    periodicityDays: number;
    roleId: number | null;
    role: {
        id: number;
        name: string;
    } | null;
    kpiRecords: {
        value: number;
        recordDate: string;
    }[];
}

interface KpiResponse {
    data: Kpi[];
    total: number;
    totalPages: number;
    page: number;
    pageSize: number;
}

export default function KpisPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL_ROLES");
    const [periodFilter, setPeriodFilter] = useState("ALL_PERIODS");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingKpi, setEditingKpi] = useState<Kpi | undefined>(undefined);

    // Fetch Roles for Filter
    const { data: roles = [] } = useQuery({
        queryKey: ["kpi-options"],
        queryFn: async () => {
            const res = await fetch("/api/kpis/options");
            if (!res.ok) throw new Error("Failed to fetch options");
            return res.json();
        },
    });

    // Fetch KPIs
    const { data: kpisData, isLoading } = useQuery<KpiResponse>({
        queryKey: ["kpis", page, search, roleFilter, periodFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: "10",
                search,
            });
            if (roleFilter && roleFilter !== "ALL_ROLES") {
                params.append("role_filter", roleFilter);
            }
            if (periodFilter && periodFilter !== "ALL_PERIODS") {
                params.append("period_filter", periodFilter);
            }

            const res = await fetch(`/api/kpis?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch KPIs");
            return res.json();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/kpis/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete KPI");
        },
        onSuccess: () => {
            toast.success("KPI eliminado exitosamente");
            queryClient.invalidateQueries({ queryKey: ["kpis"] });
        },
        onError: () => {
            toast.error("Error al eliminar el KPI");
        },
    });

    const handleEdit = (kpi: Kpi) => {
        setEditingKpi(kpi);
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        if (confirm("¿Estás seguro de que deseas eliminar este KPI?")) {
            deleteMutation.mutate(id);
        }
    };

    const handleCreate = () => {
        setEditingKpi(undefined);
        setIsModalOpen(true);
    };

    const clearFilters = () => {
        setSearch("");
        setRoleFilter("ALL_ROLES");
        setPeriodFilter("ALL_PERIODS");
        setPage(1);
    };



    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Indicadores de Gestión (KPIs)
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Gestión y seguimiento de indicadores de rendimiento
                        </p>
                    </div>
                    <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="mr-2 h-4 w-4" /> Nuevo KPI
                    </Button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                            Búsqueda
                        </label>
                        <Input
                            placeholder="Nombre o código..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                            Rol Responsable
                        </label>
                        <RichSelect
                            options={roles || []}
                            value={roleFilter === "ALL_ROLES" ? "" : roleFilter}
                            onValueChange={(val) => setRoleFilter(val || "ALL_ROLES")}
                            placeholder="Todos"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                            Actividad Reciente
                        </label>
                        <Select value={periodFilter} onValueChange={setPeriodFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todo el historial" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL_PERIODS">Todo el historial</SelectItem>
                                <SelectItem value="week">Última semana</SelectItem>
                                <SelectItem value="month">Último mes</SelectItem>
                                <SelectItem value="quarter">Último trimestre</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-end">
                        <Button
                            variant="secondary"
                            onClick={clearFilters}
                            className="w-full bg-gray-500 text-white hover:bg-gray-600"
                        >
                            Limpiar Filtros
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Código</TableHead>
                                <TableHead>Indicador</TableHead>
                                <TableHead>Meta</TableHead>
                                <TableHead>Frecuencia</TableHead>
                                <TableHead>Responsable</TableHead>
                                <TableHead>Último Registro</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        Cargando KPIs...
                                    </TableCell>
                                </TableRow>
                            ) : kpisData?.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                        No se encontraron KPIs registrados
                                    </TableCell>
                                </TableRow>
                            ) : (
                                kpisData?.data.map((kpi) => (
                                    <TableRow key={kpi.id}>
                                        <TableCell>
                                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none">
                                                {kpi.protocolCode}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium text-gray-900">
                                            {kpi.indicatorName}
                                        </TableCell>
                                        <TableCell>{kpi.targetValue ?? 'N/A'}</TableCell>
                                        <TableCell>{kpi.periodicityDays} días</TableCell>
                                        <TableCell>{kpi.role?.name || "-"}</TableCell>
                                        <TableCell>
                                            {kpi.kpiRecords && kpi.kpiRecords.length > 0 ? (
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900">
                                                        {kpi.kpiRecords[0].value}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {DateService.toDisplay(kpi.kpiRecords[0].recordDate)}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Sin registros</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    asChild
                                                    title="Ver Detalles"
                                                >
                                                    <Link href={`/kpis/${kpi.id}`}>
                                                        <Eye className="h-4 w-4 text-green-600" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(kpi)}
                                                    title="Editar"
                                                >
                                                    <Edit className="h-4 w-4 text-indigo-600" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(kpi.id)}
                                                    title="Eliminar"
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

                {kpisData && (
                    <div className="mt-4">
                        <Pagination
                            currentPage={page}
                            totalPages={kpisData.totalPages}
                            onPageChange={setPage}
                            totalItems={kpisData.total}
                        />
                    </div>
                )}
            </div>

            <KpiFormModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                kpiToEdit={editingKpi}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ["kpis"] })}
                roles={roles}
            />
        </div>
    );
}
