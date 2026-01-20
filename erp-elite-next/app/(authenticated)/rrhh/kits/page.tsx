
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { KitsTable } from "./components/KitsTable";
import { KitForm } from "./components/KitForm";
import { toast } from "sonner";

export default function KitsPage() {
    const queryClient = useQueryClient();

    // Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedKit, setSelectedKit] = useState<any>(null);

    // Fetch options
    const { data: options = {} } = useQuery({
        queryKey: ["kit-options"],
        queryFn: async () => {
            const res = await fetch("/api/rrhh/options?slug=kits&include=users&include2=employees"); // Include users for select
            return await res.json();
        }
    });

    const users = options.users || [];
    const statusOptions = options.kitStatusOptions || [];

    // Pagination
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    // Reset page to 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [search, statusFilter, dateFrom, dateTo]);

    // Fetch kits
    const { data: kitsResponse, isLoading } = useQuery({
        queryKey: ["kits", search, statusFilter, dateFrom, dateTo, page, limit],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (statusFilter && statusFilter !== "all") params.append("statusId", statusFilter);
            if (dateFrom) params.append("dateFrom", dateFrom);
            if (dateTo) params.append("dateTo", dateTo);
            params.append("page", page.toString());
            params.append("limit", limit.toString());

            const res = await fetch(`/api/rrhh/kits?${params.toString()}`);
            const data = await res.json();
            return data;
        }
    });

    const kitsData = kitsResponse?.data || [];
    const totalPages = kitsResponse?.totalPages || 1;
    const totalItems = kitsResponse?.total || 0;

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/rrhh/kits/${id}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Failed to delete");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["kits"] });
            toast.success("Kit eliminado exitosamente");
        },
        onError: (error) => {
            toast.error("Error al eliminar el kit");
            console.error(error);
        }
    });

    const handleCreate = () => {
        setSelectedKit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (kit: any) => {
        setSelectedKit(kit);
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        deleteMutation.mutate(id);
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Kits y Dotaciones</h1>
                        <p className="text-muted-foreground">Gestión de entrega de kits y materiales.</p>
                    </div>
                    <Button onClick={handleCreate} className="bg-yellow-600 hover:bg-yellow-700">
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Kit
                    </Button>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-700">Filtros</h3>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setSearch("");
                                setStatusFilter("all");
                                setDateFrom("");
                                setDateTo("");
                            }}
                            className="text-xs"
                        >
                            Limpiar filtros
                        </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Búsqueda</label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar..."
                                    className="pl-8"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Estado</label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filtrar por estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los estados</SelectItem>
                                    {statusOptions.map((status: any) => (
                                        <SelectItem key={status.id} value={status.id.toString()}>
                                            {status.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Fecha Desde</label>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                placeholder="Desde"
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Fecha Hasta</label>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                placeholder="Hasta"
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <KitsTable
                    data={kitsData || []}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    onPageChange={setPage}
                />

                {/* Form Modal */}
                <KitForm
                    open={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    initialData={selectedKit}
                    users={users}
                    statusOptions={statusOptions}
                />
            </div>
        </div>
    );
}
