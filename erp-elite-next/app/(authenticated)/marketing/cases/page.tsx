'use client';

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichSelect } from "@/components/ui/rich-select";
import { Label } from "@/components/ui/label";
import { Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import CaseTable from "./components/CaseTable";
import CaseFormModal from "./components/CaseFormModal";

export default function CasesPage() {
    const queryClient = useQueryClient();

    // State
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [projectFilter, setProjectFilter] = useState("all");
    const [responsibleFilter, setResponsibleFilter] = useState("all");
    const [mediumsFilter, setMediumsFilter] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingCase, setEditingCase] = useState<any>(null);

    const debouncedSearch = useDebounce(search, 500);

    // Fetch Options
    const { data: options } = useQuery({
        queryKey: ['marketing-cases-options'],
        queryFn: async () => {
            const res = await fetch('/api/marketing/cases/options');
            if (!res.ok) throw new Error('Failed to fetch options');
            return res.json();
        }
    });

    // Fetch Cases
    const { data: casesData, isLoading } = useQuery({
        queryKey: ['marketing-cases', page, perPage, debouncedSearch, typeFilter, statusFilter, projectFilter, responsibleFilter, mediumsFilter, dateFrom, dateTo],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                per_page: perPage.toString(),
                search: debouncedSearch,
                mediums_filter: mediumsFilter,
                date_from: dateFrom,
                date_to: dateTo,
            });

            if (typeFilter !== 'all') params.append('type_filter', typeFilter);
            if (statusFilter !== 'all') params.append('status_filter', statusFilter);
            if (projectFilter !== 'all') params.append('project_filter', projectFilter);
            if (responsibleFilter !== 'all') params.append('responsible_filter', responsibleFilter);

            const res = await fetch(`/api/marketing/cases?${params}`);
            if (!res.ok) throw new Error('Failed to fetch cases');
            return res.json();
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/marketing/cases/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete case");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["marketing-cases"] });
            toast.success("Caso eliminado correctamente");
        },
        onError: () => {
            toast.error("Error al eliminar el caso");
        }
    });

    const handleDelete = (id: number) => {
        if (confirm("¿Estás seguro de que deseas eliminar este caso?")) {
            deleteMutation.mutate(id);
        }
    };

    const handleCloseModal = () => {
        setIsCreateOpen(false);
        setEditingCase(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Casos de Marketing</h1>
                    <p className="text-muted-foreground">Gestión de casos, incidencias y solicitudes</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="bg-yellow-600 hover:bg-yellow-700">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Caso
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label>Búsqueda</Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Asunto o descripción..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {options?.typeOptions?.map((opt: any) => (
                                    <SelectItem key={opt.id} value={opt.id.toString()}>{opt.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Estado</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {options?.statusOptions?.map((opt: any) => (
                                    <SelectItem key={opt.id} value={opt.id.toString()}>{opt.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Medios</Label>
                        <Input
                            placeholder="Ej: Web..."
                            value={mediumsFilter}
                            onChange={(e) => setMediumsFilter(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Proyecto</Label>
                        <Select value={projectFilter} onValueChange={setProjectFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {options?.projectOptions?.map((opt: any) => (
                                    <SelectItem key={opt.id} value={opt.id.toString()}>{opt.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Responsable</Label>
                        <RichSelect
                            options={[{ id: "all", name: "Todos" }, ...(options?.responsibleOptions || [])]}
                            value={responsibleFilter}
                            onValueChange={setResponsibleFilter}
                            placeholder="Todos"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Desde</Label>
                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Hasta</Label>
                        <Input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button variant="outline" onClick={() => {
                        setSearch("");
                        setTypeFilter("all");
                        setStatusFilter("all");
                        setProjectFilter("all");
                        setResponsibleFilter("all");
                        setMediumsFilter("");
                        setDateFrom("");
                        setDateTo("");
                    }}>
                        <X className="mr-2 h-4 w-4" /> Limpiar Filtros
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">Cargando casos...</div>
                ) : (
                    <>
                        <CaseTable
                            data={casesData?.data || []}
                            onEdit={(item) => {
                                setEditingCase(item);
                                setIsCreateOpen(true);
                            }}
                            onDelete={handleDelete}
                        />

                        {/* Pagination */}
                        {casesData?.meta && (
                            <div className="flex items-center justify-between px-4 py-4 border-t">
                                <div className="text-sm text-gray-500">
                                    Mostrando {((page - 1) * perPage) + 1} a {Math.min(page * perPage, casesData.meta.total)} de {casesData.meta.total} resultados
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        Anterior
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={page >= casesData.meta.last_page}
                                    >
                                        Siguiente
                                    </Button>
                                    <Select
                                        value={perPage.toString()}
                                        onValueChange={(val) => {
                                            setPerPage(parseInt(val));
                                            setPage(1);
                                        }}
                                    >
                                        <SelectTrigger className="w-[80px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                            <SelectItem value="100">100</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal */}
            <CaseFormModal
                open={isCreateOpen}
                onClose={handleCloseModal}
                caseData={editingCase}
                typeOptions={options?.typeOptions || []}
                statusOptions={options?.statusOptions || []}
                responsibleOptions={options?.responsibleOptions || []}
                projectOptions={options?.projectOptions || []}
            />
        </div>
    );
}
