'use client';

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import AdPieceTable from "./components/AdPieceTable";
import AdPieceFormModal from "./components/AdPieceFormModal";

export default function AdPiecesPage() {
    const queryClient = useQueryClient();

    // State
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [formatFilter, setFormatFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [projectFilter, setProjectFilter] = useState("all");
    const [teamFilter, setTeamFilter] = useState("all");
    const [strategyFilter, setStrategyFilter] = useState("all");
    const [mediaFilter, setMediaFilter] = useState("");

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const debouncedSearch = useDebounce(search, 500);

    // Fetch Options
    const { data: options } = useQuery({
        queryKey: ['marketing-ad-pieces-options'],
        queryFn: async () => {
            const res = await fetch('/api/marketing/ad-pieces/options');
            if (!res.ok) throw new Error('Failed to fetch options');
            return res.json();
        }
    });

    // Fetch Data
    const { data: tableData, isLoading } = useQuery({
        queryKey: ['marketing-ad-pieces', page, perPage, debouncedSearch, typeFilter, formatFilter, statusFilter, projectFilter, teamFilter, strategyFilter, mediaFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                per_page: perPage.toString(),
                search: debouncedSearch,
                media_filter: mediaFilter,
            });

            if (typeFilter !== 'all') params.append('type_filter', typeFilter);
            if (formatFilter !== 'all') params.append('format_filter', formatFilter);
            if (statusFilter !== 'all') params.append('status_filter', statusFilter);
            if (projectFilter !== 'all') params.append('project_filter', projectFilter);
            if (teamFilter !== 'all') params.append('team_filter', teamFilter);
            if (strategyFilter !== 'all') params.append('strategy_filter', strategyFilter);

            const res = await fetch(`/api/marketing/ad-pieces?${params}`);
            if (!res.ok) throw new Error('Failed to fetch ad pieces');
            return res.json();
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/marketing/ad-pieces/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete item");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["marketing-ad-pieces"] });
            toast.success("Pieza eliminada correctamente");
        },
        onError: () => {
            toast.error("Error al eliminar la pieza");
        }
    });

    const handleDelete = (id: number) => {
        if (confirm("¿Estás seguro de que deseas eliminar esta pieza publicitaria?")) {
            deleteMutation.mutate(id);
        }
    };

    const handleCloseModal = () => {
        setIsCreateOpen(false);
        setEditingItem(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Piezas Publicitarias</h1>
                    <p className="text-muted-foreground">Gestión de piezas gráficas y contenido publicitario</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="bg-yellow-600 hover:bg-yellow-700">
                    <Plus className="mr-2 h-4 w-4" /> Nueva Pieza
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
                                placeholder="Nombre o medio..."
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
                        <Label>Formato</Label>
                        <Select value={formatFilter} onValueChange={setFormatFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {options?.formatOptions?.map((opt: any) => (
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
                        <Label>Medio</Label>
                        <Input
                            placeholder="Ej: Facebook..."
                            value={mediaFilter}
                            onChange={(e) => setMediaFilter(e.target.value)}
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
                        <Label>Equipo</Label>
                        <Select value={teamFilter} onValueChange={setTeamFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {options?.teamOptions?.map((opt: any) => (
                                    <SelectItem key={opt.id} value={opt.id.toString()}>{opt.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Estrategia</Label>
                        <Select value={strategyFilter} onValueChange={setStrategyFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                {options?.strategyOptions?.map((opt: any) => (
                                    <SelectItem key={opt.id} value={opt.id.toString()}>{opt.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button variant="outline" onClick={() => {
                        setSearch("");
                        setTypeFilter("all");
                        setFormatFilter("all");
                        setStatusFilter("all");
                        setProjectFilter("all");
                        setTeamFilter("all");
                        setStrategyFilter("all");
                        setMediaFilter("");
                    }}>
                        <X className="mr-2 h-4 w-4" /> Limpiar Filtros
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">Cargando piezas...</div>
                ) : (
                    <>
                        <AdPieceTable
                            data={tableData?.data || []}
                            onEdit={(item) => {
                                setEditingItem(item);
                                setIsCreateOpen(true);
                            }}
                            onDelete={handleDelete}
                        />

                        {/* Pagination */}
                        {tableData?.meta && (
                            <div className="flex items-center justify-between px-4 py-4 border-t">
                                <div className="text-sm text-gray-500">
                                    Mostrando {((page - 1) * perPage) + 1} a {Math.min(page * perPage, tableData.meta.total)} de {tableData.meta.total} resultados
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
                                        disabled={page >= tableData.meta.last_page}
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
            <AdPieceFormModal
                open={isCreateOpen}
                onClose={handleCloseModal}
                data={editingItem}
                typeOptions={options?.typeOptions || []}
                formatOptions={options?.formatOptions || []}
                statusOptions={options?.statusOptions || []}
                projectOptions={options?.projectOptions || []}
                teamOptions={options?.teamOptions || []}
                strategyOptions={options?.strategyOptions || []}
            />
        </div>
    );
}
