
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
import { Plus, Search, Eye, Pencil, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RichSelect } from "@/components/ui/rich-select";
import { WorksiteFormModal } from "./components/WorksiteFormModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DateService } from "@/lib/date-service";

interface Worksite {
    id: number;
    name: string;
    address?: string;
    project?: { id: number; name: string };
    type?: { id: number; name: string };
    status?: { id: number; name: string };
    responsible?: { id: number; name: string; profilePhotoUrl?: string };
    startDate?: string;
    endDate?: string;
}

export default function WorksitesPage() {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [projectFilter, setProjectFilter] = useState("all");
    const [responsibleFilter, setResponsibleFilter] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedWorksite, setSelectedWorksite] = useState<Worksite | undefined>(
        undefined
    );

    // Fetch Options
    const { data: options } = useQuery({
        queryKey: ["worksites-options"],
        queryFn: async () => {
            const res = await fetch("/api/worksites/options");
            if (!res.ok) throw new Error("Failed to fetch options");
            return res.json();
        },
    });

    // Fetch Worksites
    const { data: worksitesData, isLoading, refetch } = useQuery({
        queryKey: [
            "worksites",
            page,
            search,
            typeFilter,
            statusFilter,
            projectFilter,
            responsibleFilter,
            dateFrom,
            dateTo,
        ],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: "10",
                search,
                typeId: typeFilter,
                statusId: statusFilter,
                projectId: projectFilter,
                responsibleId: responsibleFilter,
                dateFrom,
                dateTo,
            });
            const res = await fetch(`/api/worksites?${params}`);
            if (!res.ok) throw new Error("Failed to fetch worksites");
            return res.json();
        },
    });

    const handleEdit = (worksite: Worksite) => {
        setSelectedWorksite(worksite);
        setIsFormOpen(true);
    };

    const handleCreate = () => {
        setSelectedWorksite(undefined);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Estás seguro de que deseas eliminar esta obra?")) return;

        try {
            const res = await fetch(`/api/worksites/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete");
            toast.success("Obra eliminada exitosamente");
            refetch();
        } catch (error) {
            toast.error("Error al eliminar la obra");
        }
    };

    const clearFilters = () => {
        setSearch("");
        setTypeFilter("all");
        setStatusFilter("all");
        setProjectFilter("all");
        setResponsibleFilter("all");
        setDateFrom("");
        setDateTo("");
        setPage(1);
    };

    const getStatusColor = (statusName?: string) => {
        if (!statusName) return "bg-gray-100 text-gray-800";
        const name = statusName.toLowerCase();
        if (
            name.includes("activa") ||
            name.includes("activo") ||
            name.includes("progreso")
        )
            return "bg-green-100 text-green-800";
        if (name.includes("pendiente")) return "bg-yellow-100 text-yellow-800";
        if (name.includes("cancelada")) return "bg-red-100 text-red-800";
        if (name.includes("finalizada")) return "bg-blue-100 text-blue-800";
        return "bg-gray-100 text-gray-800";
    };



    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Obras</h1>
                    <p className="text-muted-foreground">
                        Gestión de obras y proyectos
                    </p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Nueva Obra
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="lg:col-span-2">
                        <label className="text-sm font-medium mb-1 block">Búsqueda</label>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Nombre, dirección..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>

                    {/* Project */}
                    <div>
                        <label className="text-sm font-medium mb-1 block">Proyecto</label>
                        <RichSelect
                            options={options?.projects || []}
                            value={projectFilter !== "all" ? parseInt(projectFilter) : undefined}
                            onValueChange={(val) => setProjectFilter(val ? val.toString() : "all")}
                            placeholder="Todos"
                        />
                    </div>

                    {/* Type */}
                    <div>
                        <label className="text-sm font-medium mb-1 block">Tipo</label>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {options?.types?.map((type: any) => (
                                    <SelectItem key={type.id} value={type.id.toString()}>
                                        {type.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="text-sm font-medium mb-1 block">Estado</label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {options?.statuses?.map((status: any) => (
                                    <SelectItem key={status.id} value={status.id.toString()}>
                                        {status.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Responsible */}
                    <div>
                        <label className="text-sm font-medium mb-1 block">Responsable</label>
                        <RichSelect
                            options={options?.users || []}
                            value={responsibleFilter !== "all" ? responsibleFilter : undefined}
                            onValueChange={(val) => setResponsibleFilter(val ? val.toString() : "all")}
                            placeholder="Todos"
                            showAvatar={true}
                            imageKey="profilePhotoUrl"
                        />
                    </div>

                    {/* Date From */}
                    <div>
                        <label className="text-sm font-medium mb-1 block">Desde</label>
                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                    </div>

                    {/* Date To */}
                    <div>
                        <label className="text-sm font-medium mb-1 block">Hasta</label>
                        <Input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button variant="ghost" onClick={clearFilters} size="sm">
                        <X className="mr-2 h-4 w-4" /> Limpiar Filtros
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Obra</TableHead>
                            <TableHead>Proyecto</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Responsable</TableHead>
                            <TableHead>Fechas</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    Cargando...
                                </TableCell>
                            </TableRow>
                        ) : worksitesData?.data?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No se encontraron obras
                                </TableCell>
                            </TableRow>
                        ) : (
                            worksitesData?.data?.map((worksite: Worksite) => (
                                <TableRow key={worksite.id}>
                                    <TableCell>
                                        <div className="font-medium">{worksite.name}</div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {worksite.type?.name}
                                            {worksite.address && ` • ${worksite.address}`}
                                        </div>
                                    </TableCell>
                                    <TableCell>{worksite.project?.name || "-"}</TableCell>
                                    <TableCell>
                                        {worksite.status && (
                                            <Badge
                                                variant="secondary"
                                                className={getStatusColor(worksite.status.name)}
                                            >
                                                {worksite.status.name}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {worksite.responsible ? (
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={worksite.responsible.profilePhotoUrl} />
                                                    <AvatarFallback>{worksite.responsible.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm">{worksite.responsible.name}</span>
                                            </div>
                                        ) : (
                                            "-"
                                        )}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        <div>
                                            <span className="font-medium">I:</span>{" "}
                                            {DateService.toDisplay(worksite.startDate)}
                                        </div>
                                        <div>
                                            <span className="font-medium">F:</span>{" "}
                                            {DateService.toDisplay(worksite.endDate)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                asChild
                                            >
                                                <Link href={`/worksites/${worksite.id}`}>
                                                    <Eye className="h-4 w-4 text-blue-600" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(worksite)}
                                            >
                                                <Pencil className="h-4 w-4 text-yellow-600" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(worksite.id)}
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

            {/* Pagination - Basic implementation */}
            {worksitesData?.meta && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Página {worksitesData.meta.page} de {worksitesData.meta.totalPages}
                    </div>
                    <div className="space-x-2">
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
                            disabled={page >= worksitesData.meta.totalPages}
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
            )}

            <WorksiteFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                worksite={selectedWorksite}
            />
        </div>
    );
}
