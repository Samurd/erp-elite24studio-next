"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    bucketId: number | null;
    initialData?: any;
    planId: number;
    planMembers: any[];
    states: { id: number; name: string }[];
    priorities: { id: number; name: string }[];
}

interface TaskFormData {
    title: string;
    notes: string;
    start_date: string;
    due_date: string;
    status_id?: string;
    priority_id?: string;
}

export default function CreateTaskModal({ isOpen, onClose, bucketId, initialData, planId, planMembers, states, priorities }: CreateTaskModalProps) {
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset, setValue, control } = useForm<TaskFormData>();

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setValue("title", initialData.title);
                setValue("notes", initialData.notes || "");
                setValue("start_date", initialData.startDate ? initialData.startDate.substring(0, 10) : "");
                setValue("due_date", initialData.dueDate ? initialData.dueDate.substring(0, 10) : "");
                setValue("status_id", initialData.statusId?.toString());
                setValue("priority_id", initialData.priorityId?.toString());
            } else {
                reset();
                // Default defaults if needed
                if (states.length) setValue("status_id", states[0].id.toString());
                if (priorities.length) setValue("priority_id", priorities[0].id.toString());
            }
        }
    }, [isOpen, initialData, setValue, reset, states, priorities]);

    const mutation = useMutation({
        mutationFn: async (data: TaskFormData) => {
            const payload = {
                ...data,
                bucket_id: bucketId,
                status_id: data.status_id ? parseInt(data.status_id) : null,
                priority_id: data.priority_id ? parseInt(data.priority_id) : null,
            };

            const url = initialData
                ? `/api/planner/tasks/${initialData.id}`
                : `/api/planner/tasks`;

            const method = initialData ? "PUT" : "POST";

            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to save task");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["plan", planId] });
            toast.success(initialData ? "Tarea actualizada" : "Tarea creada");
            onClose();
        },
        onError: () => toast.error("Error al guardar tarea")
    });

    const deleteTaskMutation = useMutation({
        mutationFn: async () => {
            if (!initialData?.id) return;
            const res = await fetch(`/api/planner/tasks/${initialData.id}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Failed to delete task");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["plan", planId] });
            toast.success("Tarea eliminada");
            onClose();
        },
        onError: () => toast.error("Error al eliminar tarea")
    });


    const onSubmit = (data: TaskFormData) => {
        mutation.mutate(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex justify-between items-center pr-8">
                        <DialogTitle>{initialData ? "Editar Tarea" : "Nueva Tarea"}</DialogTitle>
                        {initialData && (
                            <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 hover:text-red-600 h-8 w-8" onClick={() => {
                                if (confirm("¿Eliminar tarea?")) deleteTaskMutation.mutate();
                            }}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="title">Título</Label>
                        <Input
                            id="title"
                            {...register("title", { required: true })}
                            placeholder="Ej. Revisar presupuesto"
                            autoFocus={!initialData}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">Estado</Label>
                            <Controller
                                control={control}
                                name="status_id"
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar estado" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {states.map((state) => (
                                                <SelectItem key={state.id} value={state.id.toString()}>
                                                    {state.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="priority">Prioridad</Label>
                            <Controller
                                control={control}
                                name="priority_id"
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar prioridad" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {priorities.map((priority) => (
                                                <SelectItem key={priority.id} value={priority.id.toString()}>
                                                    {priority.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_date">Fecha Inicio</Label>
                            <Input id="start_date" type="date" {...register("start_date")} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="due_date">Fecha Vencimiento</Label>
                            <Input id="due_date" type="date" {...register("due_date")} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas</Label>
                        <Textarea
                            id="notes"
                            {...register("notes")}
                            placeholder="Detalles adicionales..."
                            className="min-h-[100px]"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={mutation.isPending} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                            {initialData ? "Actualizar" : "Crear"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
