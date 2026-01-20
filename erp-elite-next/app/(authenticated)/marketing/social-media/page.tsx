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
import SocialMediaTable from "./components/SocialMediaTable";
import SocialMediaFormModal from "./components/SocialMediaFormModal";

export default function SocialMediaPage() {
    const queryClient = useQueryClient();

    // State
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [search, setSearch] = useState("");
    const [mediumsFilter, setMediumsFilter] = useState("");
    const [contentTypeFilter, setContentTypeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [projectFilter, setProjectFilter] = useState("all");
    const [responsibleFilter, setResponsibleFilter] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<any>(null);

    const debouncedSearch = useDebounce(search, 500);

    // Fetch Options
    const { data: options } = useQuery({
        queryKey: ['social-media-options'],
        queryFn: async () => {
            const res = await fetch('/api/marketing/social-media/options');
            if (!res.ok) throw new Error('Failed to fetch options');
            return res.json();
        }
    });

    // Fetch Posts
    const { data: postsData, isLoading } = useQuery({
        queryKey: ['social-media-posts', page, perPage, debouncedSearch, mediumsFilter, contentTypeFilter, statusFilter, projectFilter, responsibleFilter, dateFrom, dateTo],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                per_page: perPage.toString(),
                search: debouncedSearch,
                mediums_filter: mediumsFilter,
                content_type_filter: contentTypeFilter,
                date_from: dateFrom,
                date_to: dateTo,
            });

            if (statusFilter !== 'all') params.append('status_filter', statusFilter);
            if (projectFilter !== 'all') params.append('project_filter', projectFilter);
            if (responsibleFilter !== 'all') params.append('responsible_filter', responsibleFilter);

            const res = await fetch(`/api/marketing/social-media?${params}`);
            if (!res.ok) throw new Error('Failed to fetch posts');
            return res.json();
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/marketing/social-media/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete post");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["social-media-posts"] });
            toast.success("Publicación eliminada correctamente");
        },
        onError: () => {
            toast.error("Error al eliminar la publicación");
        }
    });

    const handleDelete = (id: number) => {
        if (confirm("¿Estás seguro de que deseas eliminar esta publicación?")) {
            deleteMutation.mutate(id);
        }
    };

    const handleCloseModal = () => {
        setIsCreateOpen(false);
        setEditingPost(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Redes Sociales & Web</h1>
                    <p className="text-muted-foreground">Gestión de publicaciones y contenido</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="bg-yellow-600 hover:bg-yellow-700">
                    <Plus className="mr-2 h-4 w-4" /> Nueva Publicación
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
                                placeholder="Nombre de pieza o comentarios..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Medio / Canal</Label>
                        <Input
                            placeholder="Ej: Instagram..."
                            value={mediumsFilter}
                            onChange={(e) => setMediumsFilter(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Tipo Contenido</Label>
                        <Input
                            placeholder="Ej: Reel..."
                            value={contentTypeFilter}
                            onChange={(e) => setContentTypeFilter(e.target.value)}
                        />
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
                        setMediumsFilter("");
                        setContentTypeFilter("");
                        setStatusFilter("all");
                        setProjectFilter("all");
                        setResponsibleFilter("all");
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
                    <div className="p-8 text-center">Cargando publicaciones...</div>
                ) : (
                    <>
                        <SocialMediaTable
                            data={postsData?.data || []}
                            onEdit={(post) => {
                                setEditingPost(post);
                                setIsCreateOpen(true);
                            }}
                            onDelete={handleDelete}
                        />

                        {/* Pagination */}
                        {postsData?.meta && (
                            <div className="flex items-center justify-between px-4 py-4 border-t">
                                <div className="text-sm text-gray-500">
                                    Mostrando {((page - 1) * perPage) + 1} a {Math.min(page * perPage, postsData.meta.total)} de {postsData.meta.total} resultados
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
                                        disabled={page >= postsData.meta.last_page}
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
            <SocialMediaFormModal
                open={isCreateOpen}
                onClose={handleCloseModal}
                post={editingPost}
                statusOptions={options?.statusOptions || []}
                responsibleOptions={options?.responsibleOptions || []}
                projectOptions={options?.projectOptions || []}
            />
        </div>
    );
}
