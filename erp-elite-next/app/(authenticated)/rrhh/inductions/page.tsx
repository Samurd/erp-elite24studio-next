
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter } from "lucide-react";
import { InductionsTable } from "./components/InductionsTable";
import { InductionForm } from "./components/InductionForm";
import { toast } from "sonner";



export default function InductionsPage() {
    const queryClient = useQueryClient();

    // Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [employeeFilter, setEmployeeFilter] = useState("all");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInduction, setSelectedInduction] = useState<any>(null);

    // Fetch options
    const { data: options = {} } = useQuery({
        queryKey: ["induction-options"],
        queryFn: async () => {
            const res = await fetch("/api/rrhh/options?slug=inductions&include=users&include2=employees");
            return await res.json();
        }
    });

    const employees = (options.employees || []).map((e: any) => ({ ...e, name: e.fullName }));
    const responsibles = options.users || [];
    const typeBondOptions = options.typeBondOptions || [];
    const statusOptions = options.inductionStatusOptions || [];
    const confirmationOptions = options.confirmationOptions || [];

    // Fetch inductions
    const { data: inductionsData, isLoading } = useQuery({
        queryKey: ["inductions", search, statusFilter, employeeFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (statusFilter && statusFilter !== "all") params.append("statusId", statusFilter);
            if (employeeFilter && employeeFilter !== "all") params.append("employeeId", employeeFilter);

            const res = await fetch(`/api/rrhh/inductions?${params.toString()}`);
            const data = await res.json();
            return data.data;
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/rrhh/inductions/${id}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Failed to delete");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inductions"] });
            toast.success("Inducción eliminada exitosamente");
        },
        onError: (error) => {
            toast.error("Error al eliminar la inducción");
            console.error(error);
        }
    });

    const handleCreate = () => {
        setSelectedInduction(null);
        setIsModalOpen(true);
    };

    const handleEdit = (induction: any) => {
        setSelectedInduction(induction);
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
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Inducciones</h1>
                        <p className="text-muted-foreground">Gestión de procesos de inducción y onboarding.</p>
                    </div>
                    <Button onClick={handleCreate} className="bg-yellow-600 hover:bg-yellow-700">
                        <Plus className="mr-2 h-4 w-4" /> Nueva Inducción
                    </Button>
                </div>

                {/* Filters */}
                <div className="grid gap-4 md:grid-cols-4 bg-white p-4 rounded-lg border shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filtrar por empleado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los empleados</SelectItem>
                            {employees.map((emp: any) => (
                                <SelectItem key={emp.id} value={emp.id.toString()}>
                                    {emp.fullName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

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

                {/* Table */}
                <InductionsTable
                    data={inductionsData || []}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />

                {/* Form Modal */}
                <InductionForm
                    open={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    initialData={selectedInduction}
                    employees={employees}
                    responsibles={responsibles}
                    typeBondOptions={typeBondOptions}
                    statusOptions={statusOptions}
                    confirmationOptions={confirmationOptions}
                />
            </div>
        </div>
    );
}
