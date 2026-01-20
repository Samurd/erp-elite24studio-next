"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface DeleteContactModalProps {
    open: boolean;
    onClose: () => void;
    contact?: any | null;
}

export default function DeleteContactModal({ open, onClose, contact }: DeleteContactModalProps) {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async () => {
            if (!contact) return;
            const res = await fetch(`/api/contacts/${contact.id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const error = await res.json();
                throw error;
            }

            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contacts"] });
            onClose();
        },
        onError: (error) => {
            console.error(error);
            alert("Error al eliminar contacto");
        },
    });

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Eliminar Contacto</DialogTitle>
                    <DialogDescription>
                        ¿Estás seguro de que deseas eliminar a <b>{contact?.name}</b>?
                        <br />
                        <span className="text-red-500 text-sm mt-2 block">Esta acción no se puede deshacer.</span>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
                        Cancelar
                    </Button>
                    <Button variant="destructive" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                        {mutation.isPending ? "Eliminando..." : "Eliminar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
