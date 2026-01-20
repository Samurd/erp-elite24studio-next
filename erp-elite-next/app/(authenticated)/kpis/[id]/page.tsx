
"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Plus, Edit, Trash2, Paperclip } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/pagination-component";
import { KpiRecordFormModal } from "../components/KpiRecordFormModal";
import { KpiChart } from "../components/KpiChart";

interface Kpi {
    id: number;
    protocolCode: string;
    indicatorName: string;
    targetValue: number | null;
    periodicityDays: number;
    role: {
        id: number;
        name: string;
    } | null;
}

interface KpiRecord {
    id: number;
    recordDate: string;
    value: number;
    observation: string | null;
    createdAt: string;
    createdById: number | null;
    user: {
        id: number;
        name: string;
    } | null;
    files: Array<{
        id: number;
        name: string;
        path: string;
        size: number | null;
        url: string;
    }>;
}

interface RecordsResponse {
    data: KpiRecord[];
    total: number;
    totalPages: number;
    page: number;
    pageSize: number;
}

export default function KpiDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<KpiRecord | undefined>(undefined);

    // Fetch KPI Details
    const { data: kpi, isLoading: isLoadingKpi } = useQuery<Kpi>({
        queryKey: ["kpi", id],
        queryFn: async () => {
            const res = await fetch(`/api/kpis/${id}`);
            if (!res.ok) throw new Error("Failed to fetch KPI");
            return res.json();
        },
    });

    // Fetch Records
    const { data: recordsData, isLoading: isLoadingRecords } = useQuery<RecordsResponse>({
        queryKey: ["kpi-records", id, page, search, dateFrom, dateTo],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: "10",
                search,
            });
            if (dateFrom) params.append("date_from", dateFrom);
            if (dateTo) params.append("date_to", dateTo);

            const res = await fetch(`/api/kpis/${id}/records?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch records");
            return res.json();
        },
        enabled: !!id,
    });

    const deleteRecordMutation = useMutation({
        mutationFn: async (recordId: number) => {
            const res = await fetch(`/api/kpis/records/${recordId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete record");
        },
        onSuccess: () => {
            toast.success("Registro eliminado exitosamente");
            queryClient.invalidateQueries({ queryKey: ["kpi-records"] });
        },
        onError: () => {
            toast.error("Error al eliminar el registro");
        },
    });

    const handleDeleteRecord = (recordId: number) => {
        if (confirm("¿Estás seguro de que deseas eliminar este registro?")) {
            deleteRecordMutation.mutate(recordId);
        }
    };

    const handleCreateRecord = () => {
        setEditingRecord(undefined);
        setIsRecordModalOpen(true);
    };

    const handleEditRecord = (record: KpiRecord) => {
        setEditingRecord(record);
        setIsRecordModalOpen(true);
    };

    const clearFilters = () => {
        setSearch("");
        setDateFrom("");
        setDateTo("");
        setPage(1);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString("es-CO");
    };

    if (isLoadingKpi) return <div className="p-6">Cargando KPI...</div>;
    if (!kpi) return <div className="p-6">KPI no encontrado</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center space-x-3 mb-2">
                            <h1 className="text-2xl font-bold text-gray-800">{kpi.indicatorName}</h1>
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {kpi.protocolCode}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600">
                            <p><span className="font-semibold">Objetivo (Meta):</span> {kpi.targetValue ?? 'N/A'}</p>
                            <p><span className="font-semibold">Periodicidad:</span> {kpi.periodicityDays} días</p>
                            <p><span className="font-semibold">Rol Responsable:</span> {kpi.role?.name || '-'}</p>
                        </div>
                    </div>
                    <div className="flex space-x-3">
                        <Button variant="outline" asChild>
                            <Link href="/kpis">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                            </Link>
                        </Button>
                        <Button onClick={handleCreateRecord} className="bg-green-600 hover:bg-green-700">
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Registro
                        </Button>
                    </div>
                </div>

                {/* Chart */}
                {recordsData && recordsData.data.length > 0 && (
                    <div className="mt-8 h-80 w-full">
                        <KpiChart
                            records={recordsData.data}
                            indicatorName={kpi.indicatorName}
                            targetValue={kpi.targetValue}
                        />
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Búsqueda</label>
                        <Input
                            placeholder="Buscar en observaciones..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Desde</label>
                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Hasta</label>
                        <Input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
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
            </div>

            {/* Records Table */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Observación</TableHead>
                                <TableHead>Archivos</TableHead>
                                <TableHead>Registrado Por</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingRecords ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        Cargando registros...
                                    </TableCell>
                                </TableRow>
                            ) : recordsData?.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                        No hay registros para este KPI en el periodo seleccionado
                                    </TableCell>
                                </TableRow>
                            ) : (
                                recordsData?.data.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell>{formatDate(record.recordDate)}</TableCell>
                                        <TableCell>
                                            <span className={`font-bold ${kpi.targetValue !== null
                                                    ? (record.value >= kpi.targetValue ? 'text-green-600' : 'text-red-600')
                                                    : ''
                                                }`}>
                                                {record.value}
                                            </span>
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate" title={record.observation || ""}>
                                            {record.observation || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {record.files && record.files.length > 0 ? (
                                                <div className="flex flex-col space-y-1">
                                                    {record.files.map((file) => (
                                                        <a
                                                            key={file.id}
                                                            href={file.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                                                        >
                                                            <Paperclip className="h-3 w-3 mr-1" />
                                                            {file.name}
                                                        </a>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{record.user?.name || "-"}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditRecord(record)}
                                                    title="Editar"
                                                >
                                                    <Edit className="h-4 w-4 text-blue-600" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteRecord(record.id)}
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

                {recordsData && (
                    <div className="mt-4">
                        <Pagination
                            currentPage={page}
                            totalPages={recordsData.totalPages}
                            onPageChange={setPage}
                            totalItems={recordsData.total}
                        />
                    </div>
                )}
            </div>

            <KpiRecordFormModal
                open={isRecordModalOpen}
                onOpenChange={setIsRecordModalOpen}
                kpi={kpi}
                recordToEdit={editingRecord}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["kpi-records"] });
                    // Also invalidate main kpi details/list if we want to show updated latest record
                    queryClient.invalidateQueries({ queryKey: ["kpis"] });
                }}
            />
        </div>
    );
}
