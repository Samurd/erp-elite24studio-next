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
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Edit, Eye, Plus, Search, X, FileText } from "lucide-react";
import { toast } from "sonner";
import AuditFormModal from "./components/AuditFormModal";

export default function AuditsPage() {
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState("10");
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<any>(null);
    const [modalReadOnly, setModalReadOnly] = useState(false);

    // Fetch audit types for tabs
    const { data: auditTypes = [] } = useQuery({
        queryKey: ["audit-types"],
        queryFn: async () => {
            const res = await fetch("/api/finances/audits/types");
            if (!res.ok) throw new Error("Error fetching audit types");
            return res.json();
        },
    });

    // Set first tab as active if not set
    useState(() => {
        if (auditTypes.length > 0 && !activeTab) {
            setActiveTab(auditTypes[0].slug);
        }
    });

    const { data: auditsData, isLoading, refetch } = useQuery({
        queryKey: ["audits", page, perPage, search, activeTab],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                per_page: perPage,
                search,
                active_tab: activeTab,
            });
            const res = await fetch(`/api/finances/audits?${params}`);
            if (!res.ok) throw new Error("Error fetching audits");
            return res.json();
        },
        enabled: !!activeTab,
    });

    const handleDelete = async (id: number) => {
        if (!confirm("¿Estás seguro de eliminar esta auditoría?")) return;

        try {
            const res = await fetch(`/api/finances/audits/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Error eliminando");
            toast.success("Auditoría eliminada");
            refetch();
        } catch (error) {
            toast.error("Error al eliminar la auditoría");
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
        setPage(1);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Auditorías</h1>
                    <p className="text-muted-foreground">Gestión de auditorías y controles</p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Nueva Auditoría
                </Button>
            </div>

            {/* Tabs */}
            {auditTypes.length > 0 && (
                <Card>
                    <CardContent className="pt-6">
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="w-full justify-start">
                                {auditTypes.map((type: any) => (
                                    <TabsTrigger key={type.slug} value={type.slug}>
                                        {type.name}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium">Búsqueda (Objetivo o Lugar)</label>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8"
                            />
                        </div>
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

                    {search && (
                        <div className="flex items-end md:col-span-3">
                            <Button variant="outline" onClick={clearFilters} className="w-full">
                                <X className="mr-2 h-4 w-4" /> Limpiar Filtros
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Objetivo</TableHead>
                                <TableHead>Lugar</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Fecha Auditoría</TableHead>
                                <TableHead>Archivos</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-10">Cargando...</TableCell>
                                </TableRow>
                            ) : auditsData?.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-10">No se encontraron auditorías</TableCell>
                                </TableRow>
                            ) : (
                                auditsData?.data.map((audit: any) => (
                                    <TableRow key={audit.id}>
                                        <TableCell>#{audit.id}</TableCell>
                                        <TableCell className="font-medium">{audit.objective}</TableCell>
                                        <TableCell>{audit.place}</TableCell>
                                        <TableCell>
                                            {audit.type ? (
                                                <Badge variant="secondary">{audit.type.name}</Badge>
                                            ) : "-"}
                                        </TableCell>
                                        <TableCell>
                                            {audit.status ? (
                                                <Badge variant={audit.status.color ? "default" : "outline"} style={audit.status.color ? { backgroundColor: audit.status.color } : {}}>
                                                    {audit.status.name}
                                                </Badge>
                                            ) : "-"}
                                        </TableCell>
                                        <TableCell>{DateService.toDisplay(audit.dateAudit)}</TableCell>
                                        <TableCell>
                                            {audit.filesCount > 0 && (
                                                <div className="flex items-center text-muted-foreground">
                                                    <FileText className="h-4 w-4 mr-1" /> {audit.filesCount}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleView(audit)}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(audit)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(audit.id)} className="text-red-500 hover:text-red-600">
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
            {auditsData?.meta && (
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
                            const totalPages = auditsData.meta.last_page;
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
                                className={page >= auditsData.meta.last_page ? "pointer-events-none opacity-50 gap-1 pr-2.5" : "cursor-pointer gap-1 pr-2.5"}
                                onClick={() => setPage(p => Math.min(auditsData.meta.last_page, p + 1))}
                            >
                                <span>Siguiente</span>
                                <span className="h-4 w-4">›</span>
                            </Button>
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}

            <AuditFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                record={selectedRecord}
                readOnly={modalReadOnly}
            />
        </div>
    );
}
