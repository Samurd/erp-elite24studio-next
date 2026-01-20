"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { EmployeesTable } from "./components/EmployeesTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useDebounce } from "@/hooks/use-debounce"
import { toast } from "sonner"

export default function EmployeesPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [departmentId, setDepartmentId] = useState("all");
    const [jobTitle, setJobTitle] = useState("");

    const debouncedSearch = useDebounce(search, 500);

    const { data, isLoading } = useQuery({
        queryKey: ["employees", debouncedSearch, departmentId, jobTitle, page],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append("page", page.toString());
            if (debouncedSearch) params.append("search", debouncedSearch);
            if (departmentId !== "all") params.append("department_id", departmentId);
            if (jobTitle) params.append("job_title", jobTitle);

            const res = await fetch(`/api/rrhh/employees?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch employees");
            return res.json();
        }
    });

    const { data: options } = useQuery({
        queryKey: ["rrhh-options"],
        queryFn: async () => {
            const res = await fetch("/api/rrhh/options");
            if (!res.ok) throw new Error("Failed to fetch options");
            return res.json();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await fetch(`/api/rrhh/employees/${id}`, { method: "DELETE" });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["employees"] });
            toast.success("Empleado eliminado");
        }
    });

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Empleados</h1>
                    <p className="text-slate-500">Gestión de personal - Total: {data?.meta?.total || 0}</p>
                </div>
                <div className="flex gap-2">
                    {/* Department modal button could go here if implemented */}
                    <Button asChild className="bg-yellow-600 hover:bg-yellow-700 text-white">
                        <Link href="/rrhh/employees/create">
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Empleado
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por nombre, email o identificación..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="pl-9"
                    />
                </div>
                <div>
                    <Input
                        placeholder="Filtrar por cargo..."
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                    />
                </div>
                <div>
                    <Select value={departmentId} onValueChange={(val) => setDepartmentId(val)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Todos los departamentos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los departamentos</SelectItem>
                            {options?.departments?.map((dept: any) => (
                                <SelectItem key={dept.id} value={dept.id.toString()}>
                                    {dept.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ) : (
                <EmployeesTable
                    employees={data?.data || []}
                    onDelete={(id) => {
                        if (confirm("¿Eliminar empleado?")) deleteMutation.mutate(id);
                    }}
                />
            )}

            {data?.meta && (
                <div className="flex items-center justify-between py-4">
                    <div className="text-sm text-muted-foreground">
                        Mostrando {((data.meta.page - 1) * data.meta.limit) + 1} a {Math.min(data.meta.page * data.meta.limit, data.meta.total)} de {data.meta.total} resultados
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={data.meta.page === 1}
                        >
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.min(data.meta.last_page, p + 1))}
                            disabled={data.meta.page === data.meta.last_page}
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
