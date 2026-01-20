"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import UserFormModal from "@/components/UserFormModal";
import DeleteUserModal from "@/components/DeleteUserModal";
import { Input } from "@/components/ui/input";
import { RichSelect } from "@/components/ui/rich-select";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface User {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    updatedAt: string;
    roles: Array<{ id: number; name: string; displayName: string }>;
    permissions: string[];
}

interface UsersResponse {
    data: User[];
    meta: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
    roles: Array<{ id: number; name: string; displayName: string }>;
    permissions: {
        view: boolean;
        create: boolean;
        update: boolean;
        delete: boolean;
    };
}

export default function UsersPage() {
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [page, setPage] = useState(1);

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Fetch users
    const { data, isLoading, error } = useQuery<UsersResponse>({
        queryKey: ["users", search, roleFilter, page],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                ...(search && { search }),
                ...(roleFilter && roleFilter !== "ALL" && { role: roleFilter }),
            });
            const res = await fetch(`/api/users?${params}`);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to fetch users");
            }
            return res.json();
        },
    });

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setShowEditModal(true);
    };

    const handleDelete = (user: User) => {
        setSelectedUser(user);
        setShowDeleteModal(true);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: true,
        });
    };

    if (error) {
        return (
            <div className="py-12">
                <div className="mx-auto sm:px-6 lg:px-8">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        Error fetching users: {(error as Error).message}
                    </div>
                </div>
            </div>

        );
    }

    return (
        <div className="py-12">
            <div className="mx-auto sm:px-6 lg:px-8">
                <h2 className="font-semibold text-xl text-gray-800 leading-tight mb-6">
                    Gestión de Usuarios
                </h2>

                {/* Filters */}
                <div className="mb-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex flex-1 items-center gap-4 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <Input
                                type="text"
                                placeholder="Buscar usuarios..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <RichSelect
                                value={roleFilter || "ALL"}
                                onValueChange={(val) => setRoleFilter(val === "ALL" ? "" : String(val))}
                                placeholder="Todos los roles"
                                showAvatar={false}
                                options={[
                                    { id: "ALL", name: "Todos los roles" },
                                    ...(data?.roles.map((role) => ({
                                        id: String(role.id),
                                        name: role.displayName,
                                    })) || []),
                                ]}
                            />
                        </div>

                    </div>

                    {data?.permissions.create && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded text-sm transition ease-in-out duration-150"
                        >
                            Crear nuevo usuario
                        </button>
                    )}
                </div>

                {/* Table */}
                <div className="bg-white overflow-hidden sm:rounded-lg">
                    <div className="bg-white shadow-md rounded-lg">
                        {isLoading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="px-6 py-3">Nombre</TableHead>
                                        <TableHead className="px-6 py-3">Correo</TableHead>
                                        <TableHead className="px-6 py-3">Rol</TableHead>
                                        <TableHead className="px-6 py-3">Permisos</TableHead>
                                        <TableHead className="px-6 py-3">Creado</TableHead>
                                        <TableHead className="px-6 py-3">Actualizado</TableHead>
                                        <TableHead className="px-6 py-3">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.data.map((user) => (
                                        <TableRow key={user.id} className="hover:bg-gray-50">
                                            <TableCell className="px-6 py-3 font-medium text-gray-900">{user.name}</TableCell>
                                            <TableCell className="px-6 py-3">{user.email}</TableCell>
                                            <TableCell className="px-6 py-3">
                                                {user.roles && user.roles.length > 0 ? (
                                                    <div>
                                                        {user.roles.map((role) => (
                                                            <span
                                                                key={role.id}
                                                                className="inline-block bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full mr-1"
                                                            >
                                                                {role.displayName || role.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic">Sin rol</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-6 py-3">
                                                <div className="h-24 overflow-y-auto">
                                                    {user.permissions && user.permissions.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {user.permissions.map((permission, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full whitespace-nowrap"
                                                                >
                                                                    {permission}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 italic">Sin permisos</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-3">{formatDate(user.createdAt)}</TableCell>
                                            <TableCell className="px-6 py-3">{formatDate(user.updatedAt)}</TableCell>
                                            <TableCell className="px-6 py-3">
                                                <div className="flex space-x-2">
                                                    {data?.permissions.update && (
                                                        <button
                                                            onClick={() => handleEdit(user)}
                                                            className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-xs px-3 py-1.5"
                                                        >
                                                            Editar
                                                        </button>
                                                    )}

                                                    {data?.permissions.delete && (
                                                        <button
                                                            onClick={() => handleDelete(user)}
                                                            className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:ring-4 focus:ring-red-300"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </div>

                {/* Pagination */}
                {data && data.meta.last_page > 1 && (
                    <div className="mt-6 flex justify-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                        >
                            Anterior
                        </button>
                        <span className="px-4 py-2">
                            Página {data.meta.current_page} de {data.meta.last_page}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(data.meta.last_page, p + 1))}
                            disabled={page === data.meta.last_page}
                            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </div>


            {/* Modals */}
            <UserFormModal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                roles={data?.roles || []}
            />

            <UserFormModal
                open={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                }}
                user={selectedUser}
                roles={data?.roles || []}
            />

            <DeleteUserModal
                open={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setSelectedUser(null);
                }}
                user={selectedUser}
            />
        </div>
    );
}
