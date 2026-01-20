"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface Permission {
    id: number;
    name: string;
    action: string;
    area_id: number;
    area: {
        id: number;
        name: string;
        parent_id?: number;
        parent?: {
            id: number;
            name: string;
        };
    };
}

interface RoleFormModalProps {
    open: boolean;
    onClose: () => void;
    roleId?: number | null; // If null/undefined, create mode
    onSuccess: (newRoleId?: number) => void;
}

const roleSchema = z.object({
    roleName: z.string().min(1, "El nombre del rol es obligatorio"),
    selectedPermissions: z.array(z.number()).min(1, "Debe seleccionar al menos un permiso"),
});

type RoleFormValues = z.infer<typeof roleSchema>;

export default function RoleFormModal({ open, onClose, roleId, onSuccess }: RoleFormModalProps) {
    const isEdit = !!roleId;
    const queryClient = useQueryClient();
    const [globalError, setGlobalError] = useState<string | null>(null);

    const {
        control,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<RoleFormValues>({
        resolver: zodResolver(roleSchema),
        defaultValues: {
            roleName: "",
            selectedPermissions: [],
        },
    });

    const selectedPermissions = watch("selectedPermissions");

    // Fetch Permissions
    const { data: permissions = [], isLoading: isLoadingPermissions } = useQuery<Permission[]>({
        queryKey: ["permissions"],
        queryFn: async () => {
            // Assuming this endpoint exists or strictly mirroring Laravel route
            const res = await fetch("/api/users/permissions");
            if (!res.ok) throw new Error("Failed to fetch permissions");
            return res.json();
        },
        enabled: open,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Fetch Role Details (if edit)
    const { data: roleDetails, isLoading: isLoadingRole, error: roleError } = useQuery({
        queryKey: ["role", roleId],
        queryFn: async () => {
            const res = await fetch(`/api/users/roles/${roleId}`);
            if (!res.ok) throw new Error("Failed to fetch role");
            return res.json();
        },
        enabled: open && isEdit,
    });

    // Populate form on role details load
    useEffect(() => {
        if (roleDetails) {
            setValue("roleName", roleDetails.display_name || roleDetails.name);
            setValue(
                "selectedPermissions",
                roleDetails.permissions.map((p: any) => p.id)
            );
        } else if (!isEdit) {
            reset({ roleName: "", selectedPermissions: [] });
        }
    }, [roleDetails, isEdit, setValue, reset, open]);

    // Group Permissions Logic
    const groupedPermissions = useMemo(() => {
        const groups: Record<string, { parentPermissions: Permission[]; children: Record<string, Permission[]> }> = {};

        permissions.forEach((p) => {
            const area = p.area;
            // Handle null/undefined area (Drizzle returns object with null props on left join empty)
            if (!area || !area.id) {
                const groupName = "General";
                if (!groups[groupName]) {
                    groups[groupName] = { parentPermissions: [], children: {} };
                }
                groups[groupName].parentPermissions.push(p);
                return;
            }

            const parentName = area.parent && area.parent.id ? area.parent.name : area.name;

            if (!groups[parentName]) {
                groups[parentName] = { parentPermissions: [], children: {} };
            }

            // Check if current area is a parent (has no parent_id) OR if it is the parent itself
            // If area.parent_id is null, it's a root area.
            if (!area.parent_id) {
                groups[parentName].parentPermissions.push(p);
            } else {
                const childName = area.name;
                if (!groups[parentName].children[childName]) {
                    groups[parentName].children[childName] = [];
                }
                groups[parentName].children[childName].push(p);
            }
        });

        return groups;
    }, [permissions]);


    // Update/Create Mutation
    const mutation = useMutation({
        mutationFn: async (data: RoleFormValues) => {
            const url = isEdit ? `/api/users/roles/${roleId}` : "/api/users/roles";
            const method = isEdit ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || (errorData.errors ? Object.values(errorData.errors).flat().join(", ") : "Error al guardar el rol"));
            }

            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["roles"] }); // Refresh roles list if used elsewhere
            onSuccess(data.role?.id);
            onClose();
        },
        onError: (error: Error) => {
            setGlobalError(error.message);
        },
    });

    const onSubmit = (data: RoleFormValues) => {
        setGlobalError(null);
        mutation.mutate(data);
    };

    // Dependency Logic
    const handlePermissionChange = (permissionId: number, checked: boolean) => {
        let currentSelected = [...selectedPermissions];
        const permission = permissions.find((p) => p.id === permissionId);

        if (!permission) return;

        if (checked) {
            // Add permission
            if (!currentSelected.includes(permissionId)) {
                currentSelected.push(permissionId);
            }

            // Dependency: Checked create/update/delete -> check view
            if (["create", "update", "delete"].includes(permission.action)) {
                const viewPermission = permissions.find(
                    (p) => p.area_id === permission.area_id && p.action === "view"
                );
                if (viewPermission && !currentSelected.includes(viewPermission.id)) {
                    currentSelected.push(viewPermission.id);
                }
            }
        } else {
            // Remove permission
            currentSelected = currentSelected.filter((id) => id !== permissionId);

            // Dependency: Uncheck view -> uncheck create/update/delete
            if (permission.action === "view") {
                const dependentPermissions = permissions
                    .filter(
                        (p) =>
                            p.area_id === permission.area_id &&
                            ["create", "update", "delete"].includes(p.action)
                    )
                    .map((p) => p.id);

                currentSelected = currentSelected.filter((id) => !dependentPermissions.includes(id));
            }
        }

        setValue("selectedPermissions", currentSelected, { shouldValidate: true });
    };

    const isLoading = isLoadingPermissions || (isEdit && isLoadingRole);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Editar rol" : "Crear nuevo rol"}</DialogTitle>
                    <DialogDescription>
                        Configure los permisos para este rol.
                    </DialogDescription>
                </DialogHeader>

                {globalError && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{globalError}</AlertDescription>
                    </Alert>
                )}

                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Role Name */}
                        <div className="space-y-2">
                            <Label htmlFor="roleName">Nombre del rol</Label>
                            <Controller
                                name="roleName"
                                control={control}
                                render={({ field }) => (
                                    <Input {...field} placeholder="Ej. Administrador" />
                                )}
                            />
                            {errors.roleName && (
                                <p className="text-sm text-red-500">{errors.roleName.message}</p>
                            )}
                        </div>

                        {/* Permissions */}
                        <div className="space-y-2">
                            <Label>Permisos por área</Label>
                            <div className="border rounded-md p-4 max-h-[50vh] overflow-y-auto space-y-4">
                                <Accordion type="multiple" defaultValue={Object.keys(groupedPermissions)} className="w-full">
                                    {Object.entries(groupedPermissions).map(([parentName, group], idx) => (
                                        <AccordionItem key={idx} value={parentName} className="border-b-0">
                                            <AccordionTrigger className="hover:no-underline py-2">
                                                <h3 className="font-bold text-left">{parentName}</h3>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="ml-2">
                                                    {/* Parent Direct Permissions */}
                                                    {group.parentPermissions.length > 0 && (
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                                                            {group.parentPermissions.map((perm) => (
                                                                <div key={perm.id} className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id={`perm-${perm.id}`}
                                                                        checked={selectedPermissions.includes(perm.id)}
                                                                        onCheckedChange={(checked) =>
                                                                            handlePermissionChange(perm.id, checked as boolean)
                                                                        }
                                                                    />
                                                                    <label
                                                                        htmlFor={`perm-${perm.id}`}
                                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                                    >
                                                                        {perm.action}
                                                                    </label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Children Areas */}
                                                    {Object.entries(group.children).map(([childName, childPerms]) => (
                                                        <div key={childName} className="ml-4 mt-2">
                                                            <h4 className="font-semibold text-sm text-gray-700 mb-2">{childName}</h4>
                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                                {childPerms.map((perm) => (
                                                                    <div key={perm.id} className="flex items-center space-x-2">
                                                                        <Checkbox
                                                                            id={`perm-${perm.id}`}
                                                                            checked={selectedPermissions.includes(perm.id)}
                                                                            onCheckedChange={(checked) =>
                                                                                handlePermissionChange(perm.id, checked as boolean)
                                                                            }
                                                                        />
                                                                        <label
                                                                            htmlFor={`perm-${perm.id}`}
                                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                                        >
                                                                            {perm.action}
                                                                        </label>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                            {errors.selectedPermissions && (
                                <p className="text-sm text-red-500">{errors.selectedPermissions.message}</p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : isEdit ? (
                                    "Actualizar Rol"
                                ) : (
                                    "Guardar Rol"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
