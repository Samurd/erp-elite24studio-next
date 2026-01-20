"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Search, X, Edit, Eye, Trash2 } from "lucide-react";
import MoneyDisplay from "@/components/ui/money-display";
import { Badge } from "@/components/ui/badge";
import { DateService } from "@/lib/date-service";
import BillingAccountFormModal from "./BillingAccountFormModal";
import { toast } from "sonner";

type Invoice = {
    id: number;
    code: string;
    invoiceDate: string;
    total: number;
    contact: {
        id: number;
        name: string;
    };
    status: {
        id: number;
        name: string;
        color: string;
    } | null;
};

type OptionsData = {
    statusOptions: { id: number; name: string }[];
    clientContacts: { id: number; name: string }[];
};

export default function BillingAccountsTable() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | undefined>(undefined);
    const [isViewMode, setIsViewMode] = useState(false);
    const queryClient = useQueryClient();

    const handleCreate = () => {
        setSelectedInvoiceId(undefined);
        setIsViewMode(false);
        setIsModalOpen(true);
    };

    const handleEdit = (id: number) => {
        setSelectedInvoiceId(id);
        setIsViewMode(false);
        setIsModalOpen(true);
    };

    const handleView = (id: number) => {
        setSelectedInvoiceId(id);
        setIsViewMode(true);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Estás seguro de que deseas eliminar esta cuenta de cobro?")) return;

        deleteMutation.mutate(id);
    };

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/finances/invoices/billing-accounts/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Error al eliminar la cuenta de cobro");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Cuenta de cobro eliminada correctamente");
            queryClient.invalidateQueries({ queryKey: ["invoices-billing-accounts"] });
        },
        onError: (error: Error) => {
            toast.error("Error", { description: error.message });
        },
    });

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedInvoiceId(undefined);
        setIsViewMode(false);
    };

    const [filters, setFilters] = useState({
        search: "",
        status_filter: "",
        contact_filter: "",
        date_from: "",
        date_to: "",
        page: 1,
        limit: 10,
    });

    // Fetch Options
    const { data: options } = useQuery<OptionsData>({
        queryKey: ["invoices-billing-accounts-options"],
        queryFn: async () => {
            const res = await fetch("/api/finances/invoices/billing-accounts/options");
            if (!res.ok) throw new Error("Failed to fetch options");
            return res.json();
        },
    });

    // Fetch Invoices
    const { data, isLoading } = useQuery({
        queryKey: ["invoices-billing-accounts", filters],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: filters.page.toString(),
                limit: filters.limit.toString(),
            });
            if (filters.search) params.append("search", filters.search);
            if (filters.status_filter && filters.status_filter !== "all")
                params.append("status_filter", filters.status_filter);
            if (filters.contact_filter && filters.contact_filter !== "all")
                params.append("contact_filter", filters.contact_filter);
            if (filters.date_from) params.append("date_from", filters.date_from);
            if (filters.date_to) params.append("date_to", filters.date_to);

            const res = await fetch(`/api/finances/invoices/billing-accounts?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch billing accounts");
            return res.json();
        },
    });

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    };

    const clearFilters = () => {
        setFilters({
            search: "",
            status_filter: "",
            contact_filter: "",
            date_from: "",
            date_to: "",
            page: 1,
            limit: 10,
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Cuentas de Cobro de ELITE</h1>
                    <p className="text-gray-600 mt-1">Cuentas de cobro emitidas por ELITE 24 STUDIO</p>
                </div>
                <Button onClick={handleCreate} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                    <Plus className="mr-2 h-4 w-4" /> Nueva Cuenta de Cobro
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Búsqueda</label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Código o cliente..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange("search", e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                        <Select
                            value={filters.status_filter}
                            onValueChange={(val) => handleFilterChange("status_filter", val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {options?.statusOptions.map((status) => (
                                    <SelectItem key={status.id} value={status.id.toString()}>
                                        {status.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Contact */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
                        <Select
                            value={filters.contact_filter}
                            onValueChange={(val) => handleFilterChange("contact_filter", val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {options?.clientContacts.map((contact) => (
                                    <SelectItem key={contact.id} value={contact.id.toString()}>
                                        {contact.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Per Page */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Por página</label>
                        <Select
                            value={filters.limit.toString()}
                            onValueChange={(val) => handleFilterChange("limit", val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="10" />
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
                        <Input
                            type="date"
                            value={filters.date_from}
                            onChange={(e) => handleFilterChange("date_from", e.target.value)}
                        />
                    </div>

                    {/* Date To */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
                        <Input
                            type="date"
                            value={filters.date_to}
                            onChange={(e) => handleFilterChange("date_to", e.target.value)}
                        />
                    </div>

                    {/* Clear Button */}
                    <div className="flex items-end md:col-span-2">
                        <Button variant="outline" onClick={clearFilters} className="w-full">
                            <X className="mr-2 h-4 w-4" /> Limpiar Filtros
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead>Código</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    Cargando...
                                </TableCell>
                            </TableRow>
                        ) : data?.data?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    No se encontraron cuentas de cobro
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.data?.map((invoice: Invoice) => (
                                <TableRow key={invoice.id} className="hover:bg-gray-50">
                                    <TableCell className="font-medium">{invoice.code}</TableCell>
                                    <TableCell>{invoice.contact?.name || "-"}</TableCell>
                                    <TableCell>
                                        {invoice.status ? (
                                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                                {invoice.status.name}
                                            </Badge>
                                        ) : (
                                            "-"
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <MoneyDisplay value={invoice.total || 0} />
                                    </TableCell>
                                    <TableCell>
                                        {invoice.invoiceDate ? DateService.toDisplay(invoice.invoiceDate) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleView(invoice.id)}
                                                className="text-blue-600 hover:text-blue-900 flex items-center gap-1 text-sm font-medium"
                                                title="Ver"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(invoice.id)}
                                                className="text-yellow-600 hover:text-yellow-900 flex items-center gap-1 text-sm font-medium"
                                                title="Editar"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(invoice.id)}
                                                className="text-red-600 hover:text-red-900 flex items-center gap-1 text-sm font-medium"
                                                title="Eliminar"
                                                disabled={deleteMutation.isPending}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination Logic */}
                {data?.meta && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <Button
                                variant="outline"
                                onClick={() => setFilters(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                                disabled={filters.page === 1}
                            >
                                Anterior
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setFilters(prev => ({ ...prev, page: Math.min(prev.page + 1, data.meta.totalPages) }))}
                                disabled={filters.page === data.meta.totalPages}
                            >
                                Siguiente
                            </Button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Mostrando página <span className="font-medium">{filters.page}</span> de <span className="font-medium">{data.meta.totalPages}</span> ({data.meta.total} resultados)
                                </p>
                            </div>
                            <div className="flex gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setFilters(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                                    disabled={filters.page === 1}
                                >
                                    Anterior
                                </Button>
                                {Array.from({ length: Math.min(5, data.meta.totalPages) }, (_, i) => {
                                    let p = i + 1;
                                    return (
                                        <Button
                                            key={p}
                                            variant={filters.page === p ? "default" : "outline"}
                                            size="sm"
                                            className={filters.page === p ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                                            onClick={() => setFilters(prev => ({ ...prev, page: p }))}
                                        >
                                            {p}
                                        </Button>
                                    )
                                })}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setFilters(prev => ({ ...prev, page: Math.min(prev.page + 1, data.meta.totalPages) }))}
                                    disabled={filters.page === data.meta.totalPages}
                                >
                                    Siguiente
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <BillingAccountFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                invoiceId={selectedInvoiceId}
                viewMode={isViewMode}
            />
        </div>
    );
}
