"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DateService } from "@/lib/date-service";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import MoneyDisplay from "@/components/ui/money-display";
import { RichSelect } from "@/components/ui/rich-select";
import { Trash2, Edit, Eye, Plus, Search, Calendar as CalendarIcon, X, FileText } from "lucide-react";
import { toast } from "sonner";
import TaxFormModal from "./components/TaxFormModal";

export default function TaxesPage() {
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState("10");
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<any>(null);
    const [modalReadOnly, setModalReadOnly] = useState(false);

    const { data: taxesData, isLoading, refetch } = useQuery({
        queryKey: ["taxes", page, perPage, search, typeFilter, statusFilter, dateFrom, dateTo],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                per_page: perPage,
                search,
                type_filter: typeFilter,
                status_filter: statusFilter,
                date_from: dateFrom,
                date_to: dateTo,
            });
            const res = await fetch(`/api/finances/taxes?${params}`);
            if (!res.ok) throw new Error("Error fetching taxes");
            return res.json();
        },
    });

    const { data: typeOptions = [] } = useQuery({
        queryKey: ["tags", "tipo_impuesto"],
        queryFn: async () => {
            const res = await fetch("/api/tags/options?slug=tipo_impuesto");
            return res.json();
        }
    });

    const { data: statusOptions = [] } = useQuery({
        queryKey: ["tags", "estado_impuesto"],
        queryFn: async () => {
            const res = await fetch("/api/tags/options?slug=estado_impuesto");
            return res.json();
        }
    });

    const handleDelete = async (id: number) => {
        if (!confirm("¿Estás seguro de eliminar este impuesto?")) return;

        try {
            const res = await fetch(`/api/finances/taxes/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Error eliminando");
            toast.success("Impuesto eliminado");
            refetch();
        } catch (error) {
            toast.error("Error al eliminar el impuesto");
        }
    };

    const handleCreate = () => {
        setSelectedRecord(null);
        setModalReadOnly(false);
        setIsModalOpen(true);
    };

    const handleEdit = (record: any) => {
        setSelectedRecord(record);
        setModalReadOnly(false);
        setIsModalOpen(true);
    };

    const handleView = (record: any) => {
        setSelectedRecord(record);
        setModalReadOnly(true);
        setIsModalOpen(true);
    };

    const clearFilters = () => {
        setSearch("");
        setTypeFilter("all");
        setStatusFilter("all");
        setDateFrom("");
        setDateTo("");
        setPage(1);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Impuestos</h1>
                    <p className="text-muted-foreground">Gestión de impuestos y retenciones</p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Impuesto
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Búsqueda (Entidad)</label>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar entidad..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tipo</label>
                        <RichSelect
                            placeholder="Todos"
                            value={typeFilter === "all" ? "" : typeFilter}
                            onValueChange={(val) => setTypeFilter(val || "all")}
                            options={typeOptions}
                            showAvatar={false}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Estado</label>
                        <RichSelect
                            placeholder="Todos"
                            value={statusFilter === "all" ? "" : statusFilter}
                            onValueChange={(val) => setStatusFilter(val || "all")}
                            options={statusOptions}
                            showAvatar={false}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Registros por página</label>
                        <Select value={perPage} onValueChange={(val) => { setPerPage(val); setPage(1); }}>
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

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Fecha Desde</label>
                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Fecha Hasta</label>
                        <Input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                    </div>

                    <div className="flex items-end">
                        <Button variant="outline" onClick={clearFilters} className="w-full">
                            <X className="mr-2 h-4 w-4" /> Limpiar Filtros
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Entidad</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Base</TableHead>
                                <TableHead>Porcentaje</TableHead>
                                <TableHead>Monto</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Archivos</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-10">Cargando...</TableCell>
                                </TableRow>
                            ) : taxesData?.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-10">No se encontraron impuestos</TableCell>
                                </TableRow>
                            ) : (
                                taxesData?.data.map((tax: any) => (
                                    <TableRow key={tax.id}>
                                        <TableCell>#{tax.id}</TableCell>
                                        <TableCell className="font-medium">{tax.entity}</TableCell>
                                        <TableCell>
                                            {tax.type ? (
                                                <Badge variant="secondary">{tax.type.name}</Badge>
                                            ) : "-"}
                                        </TableCell>
                                        <TableCell>
                                            {tax.status ? (
                                                <Badge variant={tax.status.color ? "default" : "outline"} style={tax.status.color ? { backgroundColor: tax.status.color } : {}}>
                                                    {tax.status.name}
                                                </Badge>
                                            ) : "-"}
                                        </TableCell>
                                        <TableCell><MoneyDisplay value={tax.base} /></TableCell>
                                        <TableCell>{tax.porcentage}%</TableCell>
                                        <TableCell className="font-bold"><MoneyDisplay value={tax.amount} /></TableCell>
                                        <TableCell>{DateService.toDisplay(tax.date)}</TableCell>
                                        <TableCell>
                                            {tax.filesCount > 0 && (
                                                <div className="flex items-center text-muted-foreground">
                                                    <FileText className="h-4 w-4 mr-1" /> {tax.filesCount}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleView(tax)}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(tax)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(tax.id)} className="text-red-500 hover:text-red-600">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            {taxesData?.meta && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <Button
                                variant="ghost"
                                size="default"
                                className={page === 1 ? "pointer-events-none opacity-50 gap-1 pl-2.5" : "cursor-pointer gap-1 pl-2.5"}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                            >
                                <span className="h-4 w-4">‹</span>
                                <span>Anterior</span>
                            </Button>
                        </PaginationItem>

                        {(() => {
                            const totalPages = taxesData.meta.last_page;
                            const maxVisible = 5;
                            let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
                            let endPage = Math.min(totalPages, startPage + maxVisible - 1);

                            if (endPage - startPage + 1 < maxVisible) {
                                startPage = Math.max(1, endPage - maxVisible + 1);
                            }

                            const pages = [];
                            for (let i = startPage; i <= endPage; i++) {
                                pages.push(i);
                            }
                            return pages.map((linkPage) => (
                                <PaginationItem key={linkPage}>
                                    <PaginationLink
                                        href="#"
                                        isActive={page === linkPage}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setPage(linkPage);
                                        }}
                                        className="cursor-pointer"
                                    >
                                        {linkPage}
                                    </PaginationLink>
                                </PaginationItem>
                            ));
                        })()}

                        <PaginationItem>
                            <Button
                                variant="ghost"
                                size="default"
                                className={page >= taxesData.meta.last_page ? "pointer-events-none opacity-50 gap-1 pr-2.5" : "cursor-pointer gap-1 pr-2.5"}
                                onClick={() => setPage(p => Math.min(taxesData.meta.last_page, p + 1))}
                            >
                                <span>Siguiente</span>
                                <span className="h-4 w-4">›</span>
                            </Button>
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}

            <TaxFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                record={selectedRecord}
                readOnly={modalReadOnly}
            />
        </div>
    );
}
