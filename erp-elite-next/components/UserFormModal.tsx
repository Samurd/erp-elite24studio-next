"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichSelect } from "@/components/ui/rich-select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import RoleFormModal from "@/components/RoleFormModal";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Role {
    id: number;
    name: string;
    displayName: string;
}

interface UserFormModalProps {
    open: boolean;
    onClose: () => void;
    user?: {
        id: string;
        name: string;
        email: string;
        roles: Role[];
    } | null;
    roles: Role[];
}

const userSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    email: z.string().email("Correo electrónico inválido"),
    password: z.string().optional(), // Handled by refine
    roleId: z.union([z.number(), z.string()]).refine((val) => val !== "" && val !== null, "El rol es obligatorio"),
}).refine((data) => {
    // If not editing (no user ID passed in context, but here we don't have that context easily in schema),
    // we handle required password logic in the component or assume optional for update and required for create logic check
    return true;
});

// We need a separate schema or manual check for password requirement on create
// Or we can dynamically create schema. For simplicity, let's keep it defined but add check in onSubmit used with isEdit.

export default function UserFormModal({ open, onClose, user, roles: initialRoles }: UserFormModalProps) {
    const isEdit = !!user;
    const queryClient = useQueryClient();
    const [roles, setRoles] = useState<Role[]>(initialRoles);

    // Sync local roles with props when they change
    useEffect(() => {
        setRoles(initialRoles);
    }, [initialRoles]);

    // Role Modal State
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
    const [showDeleteRoleAlert, setShowDeleteRoleAlert] = useState(false);


    const {
        control,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(userSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            roleId: "" as string | number,
        },
    });

    const selectedRoleId = watch("roleId");

    useEffect(() => {
        if (user) {
            reset({
                name: user.name,
                email: user.email,
                password: "",
                roleId: user.roles?.[0]?.id || "",
            });
        } else {
            reset({
                name: "",
                email: "",
                password: "",
                roleId: "",
            });
        }
    }, [user, open, reset]);

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const url = isEdit ? `/api/users/${user?.id}` : "/api/users";
            const method = isEdit ? "PUT" : "POST";

            if (!isEdit && !data.password) {
                throw { errors: { password: ["La contraseña es obligatoria para crear usuario"] } };
            }

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const error = await res.json();
                throw error;
            }

            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success(isEdit ? "Usuario actualizado correctamente" : "Usuario creado correctamente");
            handleClose();
        },
        onError: (error: any) => {
            if (error.errors) {
                // You might want to setError here for form fields
                // But since we rely on sonner/toast generally, or we map manual errors:
                // console.log(error.errors);
            }
            toast.error(error.message || "Error al guardar usuario");
        },
    });

    // Delete Role Mutation
    const deleteRoleMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/users/roles/${id}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Failed to delete role");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["roles"] }); // If roles query exists
            // Also update local roles list? Or refetch users/page which passes roles
            // Ideally we refetch the parent query, but here we can optimistic update or just wait for re-render if parent refetches
            // For now, let's also update local state
            setRoles(prev => prev.filter(r => r.id !== Number(selectedRoleId)));
            setValue("roleId", ""); // Reset selection
            toast.success("Rol eliminado correctamente");
            setShowDeleteRoleAlert(false);
            // Trigger parent refresh of roles if possible, or invalidate specific query
            queryClient.invalidateQueries({ queryKey: ["users"] }); // This might be enough if page refetches roles
        },
        onError: () => {
            toast.error("Error al eliminar el rol");
        }
    });


    const onSubmit = (data: any) => {
        mutation.mutate(data);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    // Role Actions
    const handleCreateRole = () => {
        setEditingRoleId(null);
        setShowRoleModal(true);
    };

    const handleEditRole = () => {
        if (!selectedRoleId) return;
        setEditingRoleId(Number(selectedRoleId));
        setShowRoleModal(true);
    };

    const handleDeleteRole = () => {
        if (!selectedRoleId) return;
        setShowDeleteRoleAlert(true);
    };

    const confirmDeleteRole = () => {
        if (selectedRoleId) {
            deleteRoleMutation.mutate(Number(selectedRoleId));
        }
    };

    const handleRoleSuccess = (newRoleId?: number) => {
        // Here we should reload roles. 
        // If the parent component passes roles, we might need to invalidate the query that fetches roles ("users" query in page.tsx)
        queryClient.invalidateQueries({ queryKey: ["users"] });

        // If we created a new role, verify if we can select it automatically
        // For now, invalidating "users" should update the `roles` prop if `page.tsx` fetches them there.
        // But `roles` prop updates in useEffect, so it should sync.
    };


    return (
        <>
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{isEdit ? "Editar Usuario" : "Crear Nuevo Usuario"}</DialogTitle>
                        <DialogDescription>
                            {isEdit
                                ? "Modifica los datos del usuario. Deja la contraseña en blanco para mantener la actual."
                                : "Completa los datos para crear un nuevo usuario."}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre Completo</Label>
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <Input {...field} placeholder="Nombre completo" />
                                )}
                            />
                            {errors.name && <p className="text-sm text-red-500">{errors.name.message as string}</p>}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <Controller
                                name="email"
                                control={control}
                                render={({ field }) => (
                                    <Input {...field} type="email" placeholder="correo@ejemplo.com" />
                                )}
                            />
                            {errors.email && <p className="text-sm text-red-500">{errors.email.message as string}</p>}
                        </div>

                        {/* Role */}
                        <div className="space-y-2">
                            <Label>Rol</Label>
                            <div className="flex flex-col gap-2">
                                <Controller
                                    name="roleId"
                                    control={control}
                                    render={({ field }) => (
                                        <RichSelect
                                            value={field.value ? Number(field.value) : undefined}
                                            onValueChange={field.onChange}
                                            options={roles.map((role) => ({
                                                id: role.id,
                                                name: role.displayName || role.name,
                                            }))}
                                            placeholder="Seleccionar rol"
                                            showAvatar={false}
                                        />
                                    )}
                                />
                                {errors.roleId && <p className="text-sm text-red-500">{errors.roleId.message as string}</p>}

                                <div className="flex gap-2 text-sm">
                                    <button
                                        type="button"
                                        onClick={handleCreateRole}
                                        className="flex items-center text-gray-600 hover:text-gray-900 underline"
                                    >
                                        <Plus className="mr-1 h-3 w-3" /> Crear Rol
                                    </button>
                                    {selectedRoleId && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={handleEditRole}
                                                className="flex items-center text-yellow-600 hover:text-yellow-900 underline ml-2"
                                            >
                                                <Edit className="mr-1 h-3 w-3" /> Editar Rol
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleDeleteRole}
                                                className="flex items-center text-red-600 hover:text-red-900 underline ml-2"
                                            >
                                                <Trash2 className="mr-1 h-3 w-3" /> Eliminar Rol
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">
                                {isEdit ? "Nueva Contraseña (Opcional)" : "Contraseña"}
                            </Label>
                            <Controller
                                name="password"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        type="password"
                                        placeholder={isEdit ? "Dejar en blanco para mantener" : "Contraseña"}
                                    />
                                )}
                            />
                            {isEdit && <p className="text-xs text-gray-500">Dejar en blanco para mantener la actual.</p>}
                            {/* Manually handled error for create mode password requirement if validation passes schema but fails logic */}
                            {errors.password && <p className="text-sm text-red-500">{errors.password.message as string}</p>}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleClose}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEdit ? "Actualizar" : "Crear"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <RoleFormModal
                open={showRoleModal}
                onClose={() => setShowRoleModal(false)}
                roleId={editingRoleId}
                onSuccess={handleRoleSuccess}
            />

            <AlertDialog open={showDeleteRoleAlert} onOpenChange={setShowDeleteRoleAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente el rol y podría afectar a los usuarios asignados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteRole} className="bg-red-600 hover:bg-red-700">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

