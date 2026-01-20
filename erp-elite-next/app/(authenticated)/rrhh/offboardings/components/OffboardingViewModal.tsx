
"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DateService } from "@/lib/date-service";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, CheckCircle2, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface OffboardingViewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    offboardingId?: number;
}

export function OffboardingViewModal({
    open,
    onOpenChange,
    offboardingId,
}: OffboardingViewModalProps) {
    // const { toast } = useToast(); // Removed
    const queryClient = useQueryClient();
    const [newTaskContent, setNewTaskContent] = useState("");
    const [newTaskTeam, setNewTaskTeam] = useState("");

    const { data: offboarding, isLoading: isOffboardingLoading } = useQuery({
        queryKey: ["offboarding-details", offboardingId],
        queryFn: async () => {
            if (!offboardingId) return null;
            const res = await fetch(`/api/rrhh/offboardings/${offboardingId}`);
            if (!res.ok) throw new Error("Failed to fetch details");
            return res.json();
        },
        enabled: !!offboardingId && open,
    });

    const { data: options } = useQuery({
        queryKey: ["rrhh-options-teams"],
        queryFn: async () => {
            const res = await fetch("/api/rrhh/options?slug=estado_offboarding"); // Includes teams in response
            return res.json();
        },
        staleTime: 1000 * 60 * 5,
    });

    const addTaskMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/rrhh/offboardings/${offboardingId}/tasks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: newTaskContent,
                    team_id: newTaskTeam || null,
                }),
            });
            if (!res.ok) throw new Error("Failed to add task");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["offboarding-details", offboardingId] });
            setNewTaskContent("");
            setNewTaskTeam("");
            toast.success("Tarea agregada");
        },
        onError: () => toast.error("Error al agregar tarea"),
    });

    const toggleTaskMutation = useMutation({
        mutationFn: async (taskId: number) => {
            const res = await fetch(`/api/rrhh/offboardings/tasks/${taskId}`, {
                method: "PUT"
            });
            if (!res.ok) throw new Error("Failed to toggle task");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["offboarding-details", offboardingId] });
        },
        onError: () => toast.error("Error al actualizar tarea"),
    });

    const deleteTaskMutation = useMutation({
        mutationFn: async (taskId: number) => {
            const res = await fetch(`/api/rrhh/offboardings/tasks/${taskId}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Failed to delete task");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["offboarding-details", offboardingId] });
            toast.success("Tarea eliminada");
        },
        onError: () => toast.error("Error al eliminar tarea"),
    });

    if (!offboardingId) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Detalles de OffBoarding</DialogTitle>
                </DialogHeader>

                {isOffboardingLoading || !offboarding ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Left Column: Info */}
                        <div className="md:col-span-1 space-y-6">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <h3 className="font-semibold text-gray-800 border-b pb-2 mb-3">Información General</h3>
                                <div className="space-y-4 text-sm">
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase font-semibold">Empleado</span>
                                        <div className="font-medium text-gray-900">{offboarding.employee?.fullName}</div>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase font-semibold">Fecha Salida</span>
                                        <div className="font-medium text-gray-900">{DateService.toDisplayDate(offboarding.exitDate)}</div>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase font-semibold">Proyecto</span>
                                        <div className="font-medium text-gray-900">{offboarding.project?.name || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase font-semibold">Estado</span>
                                        <div className="mt-1">
                                            <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-100">
                                                {offboarding.status?.name}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase font-semibold">Responsable</span>
                                        <div className="font-medium text-gray-900">{offboarding.responsible?.name || 'Sin asignar'}</div>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase font-semibold">Motivo</span>
                                        <p className="mt-1 p-2 bg-white rounded border border-gray-200 text-gray-600">
                                            {offboarding.reason || 'No especificado'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Tasks */}
                        <div className="md:col-span-2 space-y-6">
                            <div>
                                <h3 className="font-semibold text-gray-800 border-b pb-2 mb-4">Lista de Chequeo / Tareas</h3>

                                {/* Add Task Form */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                                    <h4 className="text-xs font-semibold text-gray-600 uppercase mb-3">Agregar Nueva Tarea</h4>
                                    <div className="grid grid-cols-1 gap-3">
                                        <Input
                                            placeholder="Descripción de la tarea..."
                                            value={newTaskContent}
                                            onChange={(e) => setNewTaskContent(e.target.value)}
                                            className="bg-white"
                                        />
                                        <div className="flex gap-2">
                                            <Select value={newTaskTeam} onValueChange={setNewTaskTeam}>
                                                <SelectTrigger className="w-[180px] bg-white">
                                                    <SelectValue placeholder="Equipo (Opcional)" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="null">Ninguno</SelectItem>
                                                    {options?.teams?.map((team: any) => (
                                                        <SelectItem key={team.id} value={team.id.toString()}>{team.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                onClick={() => addTaskMutation.mutate()}
                                                disabled={!newTaskContent || addTaskMutation.isPending}
                                                className="ml-auto bg-blue-600 hover:bg-blue-700 text-white"
                                            >
                                                {addTaskMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                                                Agregar
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Task List */}
                                <div className="space-y-2">
                                    {offboarding.tasks?.length === 0 && (
                                        <div className="text-center py-8 text-gray-500 border border-dashed rounded-lg">
                                            <p>No hay tareas registradas.</p>
                                        </div>
                                    )}
                                    {offboarding.tasks?.map((task: any) => (
                                        <div
                                            key={task.id}
                                            className={cn(
                                                "flex items-start p-3 border rounded-lg transition-all",
                                                task.completed ? "bg-green-50 border-green-200" : "bg-white border-gray-200 hover:border-gray-300"
                                            )}
                                        >
                                            <div className="flex items-center h-5 mt-1">
                                                <Checkbox
                                                    checked={!!task.completed}
                                                    onCheckedChange={() => toggleTaskMutation.mutate(task.id)}
                                                    className={cn(task.completed ? "data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600" : "")}
                                                />
                                            </div>
                                            <div className="ml-3 flex-1">
                                                <p className={cn("text-sm font-medium", task.completed ? "text-gray-500 line-through" : "text-gray-900")}>
                                                    {task.content}
                                                </p>
                                                <div className="flex gap-3 mt-1 text-xs text-gray-500">
                                                    {task.team && (
                                                        <span className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                                                            <Users className="h-3 w-3" />
                                                            {task.team.name}
                                                        </span>
                                                    )}
                                                    {task.completedBy && (
                                                        <span className="flex items-center gap-1 text-green-700">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Completado por {task.completedBy.name} el {DateService.toDisplay(task.completedAt)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 -mt-1 -mr-1"
                                                onClick={() => {
                                                    if (confirm("¿Eliminar tarea?")) deleteTaskMutation.mutate(task.id)
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
