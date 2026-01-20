"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Assuming Textarea component exists, otherwise use textarea
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface EditPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: {
        id: number;
        name: string;
        description?: string;
        projectId?: number;
    };
}

export default function EditPlanModal({ isOpen, onClose, plan }: EditPlanModalProps) {
    const queryClient = useQueryClient();
    const [name, setName] = useState(plan.name);
    const [description, setDescription] = useState(plan.description || "");

    useEffect(() => {
        if (isOpen) {
            setName(plan.name);
            setDescription(plan.description || "");
        }
    }, [isOpen, plan]);

    const updatePlanMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/planner/plans/${plan.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description }),
            });
            if (!res.ok) throw new Error("Failed to update plan");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["plan", plan.id] });
            if (plan.projectId) {
                queryClient.invalidateQueries({ queryKey: ["project", plan.projectId.toString()] });
            }
            toast.success("Plan actualizado");
            onClose();
        },
        onError: () => {
            toast.error("Error al actualizar el plan");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        updatePlanMutation.mutate();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Plan</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre del Plan</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nombre del plan"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descripción opcional"
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={updatePlanMutation.isPending}>
                            {updatePlanMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
