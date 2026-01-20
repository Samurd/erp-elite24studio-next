"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ContractsTable } from "./components/ContractsTable"
import { ContractFormModal } from "./components/ContractFormModal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { useDebounce } from "@/hooks/use-debounce"
import { toast } from "sonner"

export default function ContractsPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [selectedContract, setSelectedContract] = useState<any>(null);
    const [isReadOnly, setIsReadOnly] = useState(false);

    const debouncedSearch = useDebounce(search, 500);

    const { data, isLoading } = useQuery({
        queryKey: ["contracts", debouncedSearch, page],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append("page", page.toString());
            if (debouncedSearch) params.append("search", debouncedSearch);

            const res = await fetch(`/api/rrhh/contracts?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch contracts");
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
            await fetch(`/api/rrhh/contracts/${id}`, { method: "DELETE" });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contracts"] });
            toast.success("Contrato eliminado");
        }
    });

    const handleEdit = (contract: any) => {
        setSelectedContract(contract);
        setIsReadOnly(false);
        setShowModal(true);
    };

    const handleView = (contract: any) => {
        setSelectedContract(contract);
        setIsReadOnly(true);
        setShowModal(true);
    };

    const handleCreate = () => {
        setSelectedContract(null);
        setIsReadOnly(false);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedContract(null);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Contratos</h1>
                    <p className="text-slate-500">Gestión de contratos de empleados</p>
                </div>
                <Button onClick={handleCreate} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Contrato
                </Button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="pl-9"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ) : (
                <ContractsTable
                    contracts={data?.data || []}
                    onEdit={handleEdit}
                    onView={handleView}
                    onDelete={(id) => {
                        if (confirm("¿Eliminar contrato?")) deleteMutation.mutate(id);
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

            {options && (
                <ContractFormModal
                    open={showModal}
                    onClose={handleCloseModal}
                    contract={selectedContract}
                    isReadOnly={isReadOnly}
                    employees={options.employees || []}
                    typeOptions={options.typeOptions || []}
                    categoryOptions={options.categoryOptions || []}
                    statusOptions={options.statusOptions || []}
                    scheduleOptions={options.scheduleOptions || []}
                />
            )}
        </div>
    )
}
