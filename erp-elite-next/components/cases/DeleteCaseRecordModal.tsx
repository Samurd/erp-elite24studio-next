
"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface DeleteCaseRecordModalProps {
    open: boolean;
    onClose: () => void;
    record: { id: number } | null;
}

export default function DeleteCaseRecordModal({ open, onClose, record }: DeleteCaseRecordModalProps) {
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!record) return;
            const res = await fetch(`/api/case-records/${record.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["case-records"] });
            toast.success("Registro eliminado");
            onClose();
        },
        onError: () => toast.error("Error al eliminar registro")
    });

    if (!record) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Eliminar Registro</DialogTitle>
                    <DialogDescription>
                        ¿Estás seguro de que deseas eliminar el registro con código <strong>{record.id}</strong>? Esta acción no se puede deshacer.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                        {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
