"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, Trash2, Edit, Eye } from "lucide-react";
import ContactFormModal from "./components/ContactFormModal";
import DeleteContactModal from "./components/DeleteContactModal";
import ContactInfoModal from "./components/ContactInfoModal";

interface Contact {
    id: number;
    name: string;
    emailPersonal: string;
    emailCorporativo: string;
    company: string;
    phone: string;
    address: string;
    city: string;
    notes: string;
    firstContactDate: string;
    status: { id: number; name: string; color: string } | null;
    responsible: { id: string; name: string } | null;
    // Relations joined or raw IDs depending on what UI needs
    // Page needs joined for display, modals might need IDs (which API provided in separate fields)
    label: { name: string; color: string } | null;
}

interface ContactsResponse {
    data: Contact[];
    meta: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
    options: {
        users: any[];
        labels: any[];
        contactTypes: any[];
        relationTypes: any[];
        states: any[];
        sources: any[];
    };
    permissions: {
        view: boolean;
        create: boolean;
        update: boolean;
        delete: boolean;
    };
}

export default function ContactsPage() {
    // Filters State
    const [search, setSearch] = useState("");
    const [empresa, setEmpresa] = useState("");
    const [etiqueta, setEtiqueta] = useState("all");
    const [responsable, setResponsable] = useState("all");
    const [page, setPage] = useState(1);

    // Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

    // Fetch Data
    const { data, isLoading, error } = useQuery<ContactsResponse>({
        queryKey: ["contacts", search, empresa, etiqueta, responsable, page],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                ...(search && { search }),
                ...(empresa && { empresa }),
                ...(etiqueta && { etiqueta }),
                ...(responsable && { responsable }),
            });
            const res = await fetch(`/api/contacts?${params}`);
            if (!res.ok) throw new Error("Failed to fetch contacts");
            return res.json();
        },
    });

    const handleEdit = (contact: Contact) => {
        setSelectedContact(contact);
        setShowEditModal(true);
    };

    const handleDelete = (contact: Contact) => {
        setSelectedContact(contact);
        setShowDeleteModal(true);
    };

    const handleView = (contact: Contact) => {
        setSelectedContact(contact);
        setShowInfoModal(true);
    };

    const resetFilters = () => {
        setSearch("");
        setEmpresa("");
        setEtiqueta("all");
        setResponsable("all");
        setPage(1);
    };

    return (
        <div className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-2xl text-gray-800 leading-tight">
                        Contactos
                    </h2>
                </div>

                {/* Filters Section */}
                <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-100">
                    <div className="flex items-center gap-2 mb-4 text-gray-700">
                        <Filter className="w-5 h-5" />
                        <h3 className="font-medium">Filtros de búsqueda</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <span className="text-sm font-medium">Buscar</span>
                            <Input
                                placeholder="Buscar por nombre o correo"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        <div className="flex flex-wrap items-end gap-3">
                            <div className="flex flex-col sm:w-auto">
                                <span className="text-sm font-medium">Empresa</span>
                                <Input
                                    placeholder="Empresa"
                                    value={empresa}
                                    onChange={(e) => setEmpresa(e.target.value)}
                                    className="w-full sm:w-auto min-w-[200px]"
                                />
                            </div>

                            <div className="space-y-2 w-full sm:w-auto">
                                <span className="text-sm font-medium">Etiqueta</span>
                                <Select value={etiqueta} onValueChange={setEtiqueta} >
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Etiqueta" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas</SelectItem>
                                        {data?.options.labels.map((label: any) => (
                                            <SelectItem key={label.id} value={label.id.toString()}>{label.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 w-full sm:w-auto">
                                <span className="text-sm font-medium">Responsable</span>
                                <Select value={responsable} onValueChange={setResponsable}>
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Responsable" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        {data?.options.users.map((user: any) => (
                                            <SelectItem key={user.id} value={user.id.toString()}>{user.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button variant="secondary" onClick={resetFilters} className="ml-auto mb-0.5">
                                Limpiar filtros
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white shadow-sm rounded-lg border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-800">Base de Datos</h3>
                        {data?.permissions.create && (
                            <Button onClick={() => setShowCreateModal(true)} className="bg-black hover:bg-gray-800 text-white">
                                <Plus className="w-4 h-4 mr-2" /> Nuevo
                            </Button>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left text-gray-600">
                            <thead className="text-xs text-white uppercase bg-gradient-to-r from-black via-yellow-700 to-amber-500">
                                <tr>
                                    <th className="px-6 py-3">Nombre</th>
                                    <th className="px-6 py-3">Etiqueta</th>
                                    <th className="px-6 py-3">Email Personal</th>
                                    <th className="px-6 py-3">Email Corporativo</th>
                                    <th className="px-6 py-3">Empresa</th>
                                    <th className="px-6 py-3">Estado</th>
                                    <th className="px-6 py-3">Responsable</th>
                                    <th className="px-6 py-3">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-10 text-center text-gray-500">Cargando...</td>
                                    </tr>
                                ) : data?.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-10 text-center text-gray-500">No hay resultados</td>
                                    </tr>
                                ) : (
                                    data?.data.map((contact) => (
                                        <tr key={contact.id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-6 py-3 font-medium text-gray-900">{contact.name}</td>
                                            <td className="px-6 py-3">
                                                {contact.label ? (
                                                    <span
                                                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                                        style={{
                                                            backgroundColor: contact.label.color ? contact.label.color + '20' : '#f3f4f6',
                                                            color: contact.label.color || '#1f2937'
                                                        }}
                                                    >
                                                        {contact.label.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3">{contact.emailPersonal || "—"}</td>
                                            <td className="px-6 py-3">{contact.emailCorporativo || "—"}</td>
                                            <td className="px-6 py-3">{contact.company || "—"}</td>
                                            <td className="px-6 py-3">
                                                {contact.status ? contact.status.name : "—"}
                                            </td>
                                            <td className="px-6 py-3">
                                                {contact.responsible ? contact.responsible.name : "—"}
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => handleView(contact)} className="text-gray-500 hover:text-gray-800 transition-colors" title="Ver">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {data.permissions.update && (
                                                        <button onClick={() => handleEdit(contact)} className="text-blue-500 hover:text-blue-700 transition-colors" title="Editar">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {data.permissions.delete && (
                                                        <button onClick={() => handleDelete(contact)} className="text-red-500 hover:text-red-700 transition-colors" title="Eliminar">
                                                            <Trash2 className="w-4 h-4" />
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
                        <div className="p-4 border-t border-gray-100 flex justify-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Anterior
                            </Button>
                            <span className="flex items-center px-3 text-sm text-gray-600">
                                Página {data.meta.current_page} de {data.meta.last_page}
                            </span>
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
            </div>

            {/* Modals */}
            <ContactFormModal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                options={data?.options || { users: [], labels: [], contactTypes: [], relationTypes: [], states: [], sources: [] }}
            />

            <ContactFormModal
                open={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedContact(null);
                }}
                contact={selectedContact}
                options={data?.options || { users: [], labels: [], contactTypes: [], relationTypes: [], states: [], sources: [] }}
            />

            <DeleteContactModal
                open={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setSelectedContact(null);
                }}
                contact={selectedContact}
            />

            <ContactInfoModal
                open={showInfoModal}
                onClose={() => {
                    setShowInfoModal(false);
                    setSelectedContact(null);
                }}
                contact={selectedContact}
            />
        </div>
    );
}
