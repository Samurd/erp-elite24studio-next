"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
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

interface CreatePlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    teams: { id: number; name: string }[];
    onSuccess: () => void;
}

interface FormData {
    name: string;
    description: string;
    teamId?: string;
}

export default function CreatePlanModal({ isOpen, onClose, teams, onSuccess }: CreatePlanModalProps) {
    const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>();
    const watchTeamId = watch("teamId");

    const onSubmit = async (data: FormData) => {
        try {
            const res = await fetch("/api/planner/plans", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: data.name,
                    description: data.description,
                    teamId: data.teamId ? parseInt(data.teamId) : null
                })
            });

            if (!res.ok) throw new Error("Failed to create plan");

            toast.success("Plan creado exitosamente");
            reset();
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Error al crear el plan");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Plan</DialogTitle>
                    <DialogDescription>
                        Crea un plan para organizar tareas. Puedes asignarlo a un equipo o mantenerlo personal.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre del Plan</Label>
                        <Input
                            id="name"
                            {...register("name", { required: "El nombre es requerido" })}
                            placeholder="Ej. Marketing Q1"
                        />
                        {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            {...register("description")}
                            placeholder="Objetivos y detalles..."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="team">Equipo (Opcional)</Label>
                        <Select onValueChange={(val) => setValue("teamId", val === "none" ? "" : val)} defaultValue={watchTeamId || "none"}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar equipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Personal (Sin equipo)</SelectItem>
                                {teams.map(team => (
                                    <SelectItem key={team.id} value={team.id.toString()}>
                                        {team.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500">
                            {watchTeamId && watchTeamId !== "none"
                                ? "El equipo podrá ver y colaborar en este plan."
                                : "Solo tú podrás ver este plan."}
                        </p>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                            {isSubmitting ? "Creando..." : "Crear Plan"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
