"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, X, Eye, Pencil, Trash2 } from "lucide-react";
import { ProjectFormModal } from "./components/ProjectFormModal";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { toast } from "sonner";
import { RichSelect } from "@/components/ui/rich-select";

interface Project {
    id: number;
    name: string;
    description?: string;
    direction?: string;
    contact?: { id: number; name: string };
    status?: { id: number; name: string };
    projectType?: { id: number; name: string };
    currentStage?: { id: number; name: string };
    responsible?: { id: string; name: string };
    createdAt: string;
}

export default function ProjectsPage() {
    const router = useRouter();
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingProject, setEditingProject] = useState<number | null>(null);

    // Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [projectTypeFilter, setProjectTypeFilter] = useState("all");
    const [contactFilter, setContactFilter] = useState("all");
    const [responsibleFilter, setResponsibleFilter] = useState("all");
    const [currentStageFilter, setCurrentStageFilter] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Fetch options
    const { data: options } = useQuery({
        queryKey: ["projectOptions"],
        queryFn: async () => {
            const res = await fetch("/api/projects/options");
            if (!res.ok) throw new Error("Failed to fetch options");
            return res.json();
        },
    });

    // Fetch projects
    const { data: projectsData, isLoading, refetch } = useQuery({
        queryKey: [
            "projects",
            search,
            statusFilter,
            projectTypeFilter,
            contactFilter,
            responsibleFilter,
            currentStageFilter,
            dateFrom,
            dateTo,
            page,
            perPage,
        ],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (statusFilter && statusFilter !== "all") params.set("status_filter", statusFilter);
            if (projectTypeFilter && projectTypeFilter !== "all") params.set("project_type_filter", projectTypeFilter);
            if (contactFilter && contactFilter !== "all") params.set("contact_filter", contactFilter);
            if (responsibleFilter && responsibleFilter !== "all") params.set("responsible_filter", responsibleFilter);
            if (currentStageFilter && currentStageFilter !== "all") params.set("current_stage_filter", currentStageFilter);
            if (dateFrom) params.set("date_from", dateFrom);
            if (dateTo) params.set("date_to", dateTo);
            params.set("page", page.toString());
            params.set("perPage", perPage.toString());

            const res = await fetch(`/api/projects?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch projects");
            return res.json();
        },
    });

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("all");
        setProjectTypeFilter("all");
        setContactFilter("all");
        setResponsibleFilter("all");
        setCurrentStageFilter("all");
        setDateFrom("");
        setDateTo("");
        setPage(1);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.")) {
            return;
        }

        try {
            const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete project");
            toast.success("Proyecto eliminado exitosamente");
            refetch();
        } catch (error) {
            toast.error("Error al eliminar el proyecto");
        }
    };

    const getStatusColor = (statusName?: string) => {
        if (!statusName) return "default";
        const lower = statusName.toLowerCase();
        if (lower.includes("activo")) return "default";
        if (lower.includes("proceso") || lower.includes("progreso")) return "secondary";
        if (lower.includes("completado")) return "default";
        if (lower.includes("pausado")) return "secondary";
        if (lower.includes("cancelado")) return "destructive";
        return "default";
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Proyectos</h1>
                        <p className="text-gray-600 mt-1">Gestión completa de proyectos</p>
                    </div>
                    <Button onClick={() => { setEditingProject(null); setShowFormModal(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Proyecto
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Búsqueda</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Nombre, descripción, dirección..."
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {options?.statusOptions?.map((status: any) => (
                                    <SelectItem key={status.id} value={status.id.toString()}>
                                        {status.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                        <Select value={projectTypeFilter} onValueChange={setProjectTypeFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {options?.projectTypeOptions?.map((type: any) => (
                                    <SelectItem key={type.id} value={type.id.toString()}>
                                        {type.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Contact */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Contacto/Cliente</label>
                        <RichSelect
                            options={options?.contacts || []}
                            value={contactFilter !== "all" ? parseInt(contactFilter) : undefined}
                            onValueChange={(val) => setContactFilter(val ? val.toString() : "all")}
                            placeholder="Todos"
                            showAvatar={true}
                            imageKey="profile_photo_url"
                        />
                    </div>

                    {/* Responsible */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Responsable</label>
                        <RichSelect
                            options={options?.users || []}
                            value={responsibleFilter !== "all" ? parseInt(responsibleFilter) : undefined} // Assuming users.id is numeric
                            onValueChange={(val) => setResponsibleFilter(val ? val.toString() : "all")}
                            placeholder="Todos"
                            showAvatar={true}
                            imageKey="profile_photo_url"
                        />
                    </div>

                    {/* Current Stage */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Etapa Actual</label>
                        <Select value={currentStageFilter} onValueChange={setCurrentStageFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                {options?.stages?.map((stage: any) => (
                                    <SelectItem key={stage.id} value={stage.id.toString()}>
                                        {stage.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Per Page */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Por página</label>
                        <Select value={perPage.toString()} onValueChange={(v) => setPerPage(parseInt(v))}>
                            <SelectTrigger>
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

                    {/* Date From */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Desde</label>
                        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    </div>

                    {/* Date To */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
                        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    </div>

                    {/* Clear Button */}
                    <div className="flex items-end">
                        <Button variant="outline" onClick={clearFilters} className="w-full">
                            <X className="mr-2 h-4 w-4" />
                            Limpiar
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Proyecto</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Etapa Actual</TableHead>
                            <TableHead>Responsable</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    Cargando...
                                </TableCell>
                            </TableRow>
                        ) : projectsData?.data?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    No se encontraron proyectos
                                </TableCell>
                            </TableRow>
                        ) : (
                            projectsData?.data?.map((project: Project) => (
                                <TableRow key={project.id} className="hover:bg-gray-50">
                                    <TableCell>
                                        <div className="font-medium text-gray-900">{project.name}</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {project.projectType?.name}
                                            {project.direction && <span className="ml-1">• {project.direction}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-gray-900">{project.contact?.name || "-"}</div>
                                    </TableCell>
                                    <TableCell>
                                        {project.status && (
                                            <Badge variant={getStatusColor(project.status.name)}>
                                                {project.status.name}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {project.currentStage ? (
                                            <Badge variant="outline">{project.currentStage.name}</Badge>
                                        ) : (
                                            <span className="text-gray-400 text-sm">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {project.responsible ? (
                                            <div className="flex items-center">
                                                <span className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium mr-2">
                                                    {project.responsible.name.substring(0, 2).toUpperCase()}
                                                </span>
                                                <span className="text-sm text-gray-900">{project.responsible.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-sm">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end space-x-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.push(`/projects/${project.id}`)}
                                                title="Ver detalles"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setEditingProject(project.id);
                                                    setShowFormModal(true);
                                                }}
                                                title="Editar"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(project.id)}
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

                {/* Pagination */}
                {projectsData?.pagination && projectsData.data.length > 0 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                        <div className="text-sm text-gray-700">
                            Mostrando{" "}
                            <span className="font-medium">
                                {(page - 1) * perPage + 1}
                            </span>{" "}
                            a{" "}
                            <span className="font-medium">
                                {Math.min(page * perPage, projectsData.pagination.total)}
                            </span>{" "}
                            de <span className="font-medium">{projectsData.pagination.total}</span> resultados
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(page - 1)}
                                disabled={page === 1}
                            >
                                Anterior
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(page + 1)}
                                disabled={page >= projectsData.pagination.totalPages}
                            >
                                Siguiente
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Form Modal */}
            {showFormModal && (
                <ProjectFormModal
                    projectId={editingProject}
                    onClose={() => {
                        setShowFormModal(false);
                        setEditingProject(null);
                    }}
                    onSuccess={() => {
                        setShowFormModal(false);
                        setEditingProject(null);
                        refetch();
                    }}
                />
            )}
        </div>
    );
}
