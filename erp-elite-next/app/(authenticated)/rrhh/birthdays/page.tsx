"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { BirthdaysTable } from "./components/BirthdaysTable";
import { BirthdayForm } from "./components/BirthdayForm";
import { toast } from "sonner";

const MONTH_OPTIONS = [
    { id: 1, name: "Enero" },
    { id: 2, name: "Febrero" },
    { id: 3, name: "Marzo" },
    { id: 4, name: "Abril" },
    { id: 5, name: "Mayo" },
    { id: 6, name: "Junio" },
    { id: 7, name: "Julio" },
    { id: 8, name: "Agosto" },
    { id: 9, name: "Septiembre" },
    { id: 10, name: "Octubre" },
    { id: 11, name: "Noviembre" },
    { id: 12, name: "Diciembre" },
];

export default function BirthdaysPage() {
    const queryClient = useQueryClient();

    // Filters
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [monthFilter, setMonthFilter] = useState("all");

    // Pagination
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBirthday, setSelectedBirthday] = useState<any>(null);

    // Reset page to 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [search, typeFilter, monthFilter]);

    // Fetch options
    const { data: options, isLoading: isLoadingOptions } = useQuery({
        queryKey: ["birthday-options"],
        queryFn: async () => {
            const res = await fetch("/api/rrhh/options?slug=birthdays&include=users&include2=employees&include3=contacts");
            return await res.json();
        }
    });

    const users = options?.users || [];
    const employees = options?.employees || [];
    const contacts = options?.contacts || [];

    // Fetch birthdays
    const { data: birthdaysResponse, isLoading } = useQuery({
        queryKey: ["birthdays", search, typeFilter, monthFilter, page, limit],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (typeFilter && typeFilter !== "all") params.append("typeFilter", typeFilter);
            if (monthFilter && monthFilter !== "all") params.append("monthFilter", monthFilter);
            params.append("page", page.toString());
            params.append("limit", limit.toString());

            const res = await fetch(`/api/rrhh/birthdays?${params.toString()}`);
            const data = await res.json();
            return data;
        }
    });

    const birthdaysData = birthdaysResponse?.data || [];
    const totalPages = birthdaysResponse?.totalPages || 1;
    const totalItems = birthdaysResponse?.total || 0;

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/rrhh/birthdays/${id}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Failed to delete");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["birthdays"] });
            toast.success("Cumpleaños eliminado exitosamente");
        },
        onError: (error) => {
            toast.error("Error al eliminar el cumpleaños");
            console.error(error);
        }
    });

    const handleCreate = () => {
        setSelectedBirthday(null);
        setIsModalOpen(true);
    };

    const handleEdit = (birthday: any) => {
        setSelectedBirthday(birthday);
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
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Cumpleaños</h1>
                        <p className="text-muted-foreground">Gestión de cumpleaños y recordatorios</p>
                    </div>
                    <Button onClick={handleCreate} className="bg-yellow-600 hover:bg-yellow-700">
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Cumpleaños
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
                                setTypeFilter("all");
                                setMonthFilter("all");
                            }}
                            className="text-xs"
                        >
                            Limpiar filtros
                        </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Búsqueda</label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por nombre..."
                                    className="pl-8"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Tipo</label>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos los tipos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los tipos</SelectItem>
                                    <SelectItem value="employee">Empleados</SelectItem>
                                    <SelectItem value="contact">Contactos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Mes</label>
                            <Select value={monthFilter} onValueChange={setMonthFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos los meses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los meses</SelectItem>
                                    {MONTH_OPTIONS.map((month) => (
                                        <SelectItem key={month.id} value={month.id.toString()}>
                                            {month.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <BirthdaysTable
                    data={birthdaysData || []}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    onPageChange={setPage}
                />

                {/* Form Modal */}
                <BirthdayForm
                    open={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    initialData={selectedBirthday}
                    users={users}
                    employees={employees}
                    contacts={contacts}
                />
            </div>
        </div>
    );
}
