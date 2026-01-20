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
import StrategyTable from "./components/StrategyTable";
import StrategyFormModal from "./components/StrategyFormModal";

export default function StrategiesPage() {
    const queryClient = useQueryClient();

    // State
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [responsibleFilter, setResponsibleFilter] = useState("all");

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingStrategy, setEditingStrategy] = useState<any>(null);

    const debouncedSearch = useDebounce(search, 500);

    // Fetch Options
    const { data: options } = useQuery({
        queryKey: ['strategies-options'],
        queryFn: async () => {
            const res = await fetch('/api/marketing/strategies/options');
            if (!res.ok) throw new Error('Failed to fetch options');
            return res.json();
        }
    });

    // Fetch Strategies
    const { data: strategiesData, isLoading } = useQuery({
        queryKey: ['strategies', page, perPage, debouncedSearch, statusFilter, responsibleFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                per_page: perPage.toString(),
                search: debouncedSearch,
            });

            if (statusFilter !== 'all') params.append('status_filter', statusFilter);
            if (responsibleFilter !== 'all') params.append('responsible_filter', responsibleFilter);

            const res = await fetch(`/api/marketing/strategies?${params}`);
            if (!res.ok) throw new Error('Failed to fetch strategies');
            return res.json();
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/marketing/strategies/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete strategy");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["strategies"] });
            toast.success("Estrategia eliminada correctamente");
        },
        onError: () => {
            toast.error("Error al eliminar la estrategia");
        }
    });

    const handleDelete = (id: number) => {
        if (confirm("¿Estás seguro de que deseas eliminar esta estrategia?")) {
            deleteMutation.mutate(id);
        }
    };

    const handleCloseModal = () => {
        setIsCreateOpen(false);
        setEditingStrategy(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Estrategias de Marketing</h1>
                    <p className="text-muted-foreground">Gestión de estrategias y campañas de marketing</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="bg-yellow-600 hover:bg-yellow-700">
                    <Plus className="mr-2 h-4 w-4" /> Nueva Estrategia
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
                                placeholder="Nombre, objetivo..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
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
                        <Label>Responsable</Label>
                        <RichSelect
                            options={[{ id: "all", name: "Todos" }, ...(options?.responsibleOptions || [])]}
                            value={responsibleFilter}
                            onValueChange={setResponsibleFilter}
                            placeholder="Todos"
                        />
                    </div>

                    <div className="flex items-end">
                        <Button variant="outline" className="w-full" onClick={() => {
                            setSearch("");
                            setStatusFilter("all");
                            setResponsibleFilter("all");
                        }}>
                            <X className="mr-2 h-4 w-4" /> Limpiar Filtros
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">Cargando estrategias...</div>
                ) : (
                    <>
                        <StrategyTable
                            data={strategiesData?.data || []}
                            onEdit={(strategy) => {
                                setEditingStrategy(strategy);
                                setIsCreateOpen(true);
                            }}
                            onDelete={handleDelete}
                        />

                        {/* Pagination */}
                        {strategiesData?.meta && (
                            <div className="flex items-center justify-between px-4 py-4 border-t">
                                <div className="text-sm text-gray-500">
                                    Mostrando {((page - 1) * perPage) + 1} a {Math.min(page * perPage, strategiesData.meta.total)} de {strategiesData.meta.total} resultados
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
                                        disabled={page >= strategiesData.meta.last_page}
                                    >
                                        Siguiente
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal */}
            <StrategyFormModal
                open={isCreateOpen}
                onClose={handleCloseModal}
                strategy={editingStrategy}
                statusOptions={options?.statusOptions || []}
                responsibleOptions={options?.responsibleOptions || []}
            />
        </div>
    );
}
