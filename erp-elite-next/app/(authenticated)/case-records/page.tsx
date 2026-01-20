
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Eye, Edit, Trash2, Plus, ExternalLink } from "lucide-react";
import Link from "next/link";
import CaseRecordFormModal from "@/components/cases/CaseRecordFormModal";
// import DeleteCaseRecordModal from "@/components/cases/DeleteCaseRecordModal"; // Import later after creating file
import DeleteCaseRecordModal from "@/components/cases/DeleteCaseRecordModal";

interface CaseRecord {
    id: number;
    date: string;
    channel: string;
    description: string;
    contact: { id: number; name: string };
    assigned_to: { id: number; name: string };
    status: { id: number; name: string; color?: string };
    type: { id: number; name: string };
    files?: any[];
}

interface CaseRecordsResponse {
    data: CaseRecord[];
    meta: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
    options: {
        users: any[];
        states: any[];
        case_types: any[];
        contacts: any[];
    };
    permissions: {
        view: boolean;
        create: boolean;
        update: boolean;
        delete: boolean;
    };
}

export default function CaseRecordsPage() {
    // Filters
    const [search, setSearch] = useState("");
    const [canal, setCanal] = useState("");
    const [estado, setEstado] = useState("all");
    const [tipoCaso, setTipoCaso] = useState("all");
    const [asesor, setAsesor] = useState("all");
    const [fecha, setFecha] = useState("");
    const [page, setPage] = useState(1);

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<CaseRecord | null>(null);

    // Query
    const { data, isLoading, error } = useQuery<CaseRecordsResponse>({
        queryKey: ["case-records", search, canal, estado, tipoCaso, asesor, fecha, page],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                ...(search && { search }),
                ...(canal && { canal }),
                ...(estado && estado !== "all" && { estado }),
                ...(tipoCaso && tipoCaso !== "all" && { tipo_caso: tipoCaso }),
                ...(asesor && asesor !== "all" && { asesor }),
                ...(fecha && { fecha }),
            });
            const res = await fetch(`/api/case-records?${params}`);
            if (!res.ok) throw new Error("Failed to fetch");
            return res.json();
        }
    });

    const handleEdit = (record: CaseRecord) => {
        setSelectedRecord(record);
        setShowEditModal(true);
    };

    const handleDelete = (record: CaseRecord) => {
        setSelectedRecord(record);
        setShowDeleteModal(true);
    };

    const resetFilters = () => {
        setSearch("");
        setCanal("");
        setEstado("all");
        setTipoCaso("all");
        setAsesor("all");
        setFecha("");
        setPage(1);
    };

    return (
        <div className="py-8 bg-gray-100 min-h-screen font-sans">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Filters */}
                <div className="bg-white shadow-md rounded-lg p-6 mb-8">
                    <div className="flex items-center gap-2 mb-4 text-gray-800">
                        <h2 className="text-xl font-bold">Filtros de búsqueda</h2>
                    </div>

                    <div className="space-y-4">
                        <Input
                            placeholder="Buscar por asesor, contacto..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full focus:ring-yellow-500 focus:border-yellow-500"
                        />

                        <div className="flex flex-wrap items-center gap-3">
                            <Input
                                placeholder="Canal"
                                value={canal}
                                onChange={(e) => setCanal(e.target.value)}
                                className="w-full sm:w-auto min-w-[150px]"
                            />

                            <Select value={tipoCaso} onValueChange={setTipoCaso}>
                                <SelectTrigger className="w-full sm:w-[150px]">
                                    <SelectValue placeholder="Tipo de caso" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tipo de caso</SelectItem>
                                    {data?.options.case_types.map((opt: any) => (
                                        <SelectItem key={opt.id} value={opt.id.toString()}>{opt.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={estado} onValueChange={setEstado}>
                                <SelectTrigger className="w-full sm:w-[150px]">
                                    <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Estado</SelectItem>
                                    {data?.options.states.map((opt: any) => (
                                        <SelectItem key={opt.id} value={opt.id.toString()}>{opt.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={asesor} onValueChange={setAsesor}>
                                <SelectTrigger className="w-full sm:w-[150px]">
                                    <SelectValue placeholder="Asesor" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Asesor</SelectItem>
                                    {data?.options.users.map((opt: any) => (
                                        <SelectItem key={opt.id} value={opt.id.toString()}>{opt.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Input
                                type="date"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                className="w-full sm:w-auto"
                            />

                            <Button onClick={resetFilters} className="bg-yellow-500 hover:bg-yellow-600 text-white ml-auto">
                                Limpiar filtros
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white w-full p-6 rounded-xl shadow">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-2xl font-bold leading-none">Área comercial</h3>
                            <h3 className="text-lg font-bold leading-none text-gray-500 mt-1">Elite 24 STUDIO S.A.S</h3>
                        </div>
                        <div className="rounded-full p-1 bg-gradient-to-r from-black via-amber-900 to-amber-500">
                            <Button onClick={() => setShowCreateModal(true)} variant="ghost" className="text-white hover:text-gray-200 hover:bg-transparent">
                                <Plus className="w-4 h-4 mr-2" /> Nuevo registro
                            </Button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto w-full rounded-xl bg-white shadow border border-gray-100">
                        <table className="w-full text-sm text-left text-gray-500 whitespace-nowrap">
                            <thead className="text-xs text-white uppercase bg-gradient-to-r from-black via-amber-900 to-amber-500">
                                <tr>
                                    <th className="px-6 py-5">Cod</th>
                                    <th className="px-6 py-5">Fecha</th>
                                    <th className="px-6 py-5">Nombre Contacto</th>
                                    <th className="px-6 py-5">Nombre Asesor</th>
                                    <th className="px-6 py-5">Tipo de caso</th>
                                    <th className="px-6 py-5">Estado</th>
                                    <th className="px-6 py-5">Canal</th>
                                    <th className="px-6 py-5">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan={8} className="text-center py-6">Cargando...</td></tr>
                                ) : data?.data.length === 0 ? (
                                    <tr><td colSpan={8} className="text-center py-6">No hay registros disponibles.</td></tr>
                                ) : (
                                    data?.data.map((record) => (
                                        <tr key={record.id} className="border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{record.id}</td>
                                            <td className="px-6 py-4">{record.date}</td>
                                            <td className="px-6 py-4">
                                                {record.contact ? (
                                                    <Link href={`/contacts?search=${record.contact.name}`} target="_blank" className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
                                                        {record.contact.name}
                                                        <ExternalLink className="w-3 h-3" />
                                                    </Link>
                                                ) : "No contacto relacionado"}
                                            </td>
                                            <td className="px-6 py-4">{record.assigned_to?.name || "No asesor relacionado"}</td>
                                            <td className="px-6 py-4">{record.type?.name || "-"}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center">
                                                    <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: record.status?.color || '#000' }}></span>
                                                    {record.status?.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">{record.channel}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {data.permissions.update && (
                                                        <button onClick={() => handleEdit(record)} className="text-gray-600 hover:text-yellow-700 uppercase font-bold text-xs">
                                                            Editar
                                                        </button>
                                                    )}
                                                    {data.permissions.delete && (
                                                        <button onClick={() => handleDelete(record)} className="text-red-500 hover:text-red-700 text-xs uppercase font-bold">
                                                            Eliminar
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {data && data.meta.last_page > 1 && (
                        <div className="mt-6 flex justify-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Anterior
                            </Button>
                            <span className="flex items-center text-sm text-gray-600">Página {page} de {data.meta.last_page}</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(data.meta.last_page, p + 1))}
                                disabled={page === data.meta.last_page}
                            >
                                Siguiente
                            </Button>
                        </div>
                    )}
                </div>

            </main>


            {/* Modals */}
            <CaseRecordFormModal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                options={data?.options || { users: [], states: [], case_types: [], contacts: [] }}
            />

            <CaseRecordFormModal
                open={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedRecord(null);
                }}
                record={selectedRecord}
                options={data?.options || { users: [], states: [], case_types: [], contacts: [] }}
            />

            <DeleteCaseRecordModal
                open={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setSelectedRecord(null);
                }}
                record={selectedRecord}
            />

        </div>
    );
}
