"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface DeleteUserModalProps {
    open: boolean;
    onClose: () => void;
    user: {
        id: string;
        name: string;
        email: string;
    } | null;
}

export default function DeleteUserModal({ open, onClose, user }: DeleteUserModalProps) {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (userId: string) => {
            const res = await fetch("/api/users", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });

            if (!res.ok) {
                throw new Error("Failed to delete user");
            }

            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            onClose();
        },
        onError: () => {
            alert("Error al eliminar usuario");
        },
    });

    const handleDelete = () => {
        if (user) {
            mutation.mutate(user.id);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Eliminar Usuario</DialogTitle>
                    <DialogDescription>
                        ¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.
                    </DialogDescription>
                </DialogHeader>

                {user && (
                    <div className="py-4">
                        <p className="text-sm text-gray-600">
                            <strong>Nombre:</strong> {user.name}
                        </p>
                        <p className="text-sm text-gray-600">
                            <strong>Email:</strong> {user.email}
                        </p>
                    </div>
                )}

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? "Eliminando..." : "Eliminar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
