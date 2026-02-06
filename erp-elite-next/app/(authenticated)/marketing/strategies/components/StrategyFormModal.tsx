'use client';

import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichSelect } from "@/components/ui/rich-select";
import { toast } from "sonner";
import { Target } from "lucide-react";
import ModelAttachments, { ModelAttachmentsRef } from "@/components/cloud/ModelAttachments";
import { DateService } from "@/lib/date-service";

interface StrategyFormModalProps {
    open: boolean;
    onClose: () => void;
    strategy?: any | null; // If null, it's create mode
    statusOptions: any[];
    responsibleOptions: any[];
}

export default function StrategyFormModal({ open, onClose, strategy, statusOptions, responsibleOptions }: StrategyFormModalProps) {
    const isEdit = !!strategy;
    const queryClient = useQueryClient();
    const attachmentsRef = useRef<ModelAttachmentsRef>(null);

    // Fetch full strategy details including files for realtime updates
    const { data: fetchedStrategy } = useQuery({
        queryKey: ["strategy", strategy?.id],
        queryFn: async () => {
            if (!strategy?.id) return null;
            const res = await fetch(`/api/marketing/strategies/${strategy.id}`);
            if (!res.ok) throw new Error("Failed to fetch strategy");
            return res.json();
        },
        enabled: open && isEdit,
    });

    const activeStrategy = fetchedStrategy || strategy;

    const [formData, setFormData] = useState({
        name: "",
        objective: "",
        status_id: "",
        start_date: "",
        end_date: "",
        target_audience: "",
        platforms: "",
        responsible_id: "",
        notify_team: false,
        observations: "",
        files: [] as File[],
        pending_file_ids: [] as number[],
    });

    useEffect(() => {
        if (activeStrategy && isEdit) {
            setFormData({
                name: activeStrategy.name || "",
                objective: activeStrategy.objective || "",
                status_id: activeStrategy.statusId ? activeStrategy.statusId.toString() : "",
                start_date: DateService.toInput(activeStrategy.startDate),
                end_date: DateService.toInput(activeStrategy.endDate),
                target_audience: activeStrategy.targetAudience || "",
                platforms: activeStrategy.platforms || "",
                responsible_id: activeStrategy.responsibleId ? activeStrategy.responsibleId.toString() : "",
                notify_team: activeStrategy.notifyTeam === 1,
                observations: activeStrategy.observations || "",
                files: [], // Files handled by ModelAttachments in edit
                pending_file_ids: [],
            });
        } else {
            setFormData({
                name: "",
                objective: "",
                status_id: "",
                start_date: "",
                end_date: "",
                target_audience: "",
                platforms: "",
                responsible_id: "",
                notify_team: false,
                observations: "",
                files: [],
                pending_file_ids: [],
            });
        }
    }, [activeStrategy, open, isEdit]);

    const mutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const allFileIds = await attachmentsRef.current?.upload() || [];
            // Remove 'files' from payload if it exists in data object to avoid circular JSON (if it was File objects)
            // But we can just override pending_file_ids
            const payload = { ...data, pending_file_ids: allFileIds };

            const url = isEdit ? `/api/marketing/strategies/${strategy.id}` : "/api/marketing/strategies";
            const method = isEdit ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Error saving strategy");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["strategies"] });
            if (activeStrategy?.id) {
                queryClient.invalidateQueries({ queryKey: ["strategy", activeStrategy.id] });
            }
            toast.success(isEdit ? "Estrategia actualizada" : "Estrategia creada");
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.message);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-yellow-100 p-2 rounded-full text-yellow-600">
                            <Target className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle>{isEdit ? "Editar Estrategia" : "Nueva Estrategia"}</DialogTitle>
                            <DialogDescription>
                                {isEdit ? "Actualiza la información de la estrategia" : "Complete los datos para registrar una nueva estrategia de marketing"}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Name */}
                        <div className="lg:col-span-2 space-y-2">
                            <Label htmlFor="name">Nombre de la Estrategia *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej: Campaña de Verano 2024"
                                required
                            />
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <Label htmlFor="status">Estado</Label>
                            <Select value={formData.status_id} onValueChange={(val) => setFormData({ ...formData, status_id: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((option) => (
                                        <SelectItem key={option.id} value={option.id.toString()}>{option.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Objective */}
                    <div className="space-y-2">
                        <Label htmlFor="objective">Objetivo Principal</Label>
                        <Textarea
                            id="objective"
                            value={formData.objective}
                            onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                            placeholder="Describir el objetivo principal..."
                            rows={3}
                        />
                    </div>

                    {/* Dates & Responsible */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="start_date">Fecha de Inicio</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end_date">Fecha de Fin</Label>
                            <Input
                                id="end_date"
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="responsible">Responsable</Label>
                            <RichSelect
                                options={responsibleOptions}
                                value={formData.responsible_id}
                                onValueChange={(val) => setFormData({ ...formData, responsible_id: val })}
                                placeholder="Seleccionar"
                            />
                        </div>
                    </div>

                    {/* Audience & Platforms */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="target_audience">Público Objetivo</Label>
                            <Input
                                id="target_audience"
                                value={formData.target_audience}
                                onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                                placeholder="Ej: Jóvenes 18-25 años"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="platforms">Plataformas</Label>
                            <Input
                                id="platforms"
                                value={formData.platforms}
                                onChange={(e) => setFormData({ ...formData, platforms: e.target.value })}
                                placeholder="Ej: Instagram, LinkedIn"
                            />
                        </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        <Label>Opciones Adicionales</Label>
                        <div className="flex gap-6">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="notify_team"
                                    checked={formData.notify_team}
                                    onCheckedChange={(checked) => setFormData({ ...formData, notify_team: checked === true })}
                                />
                                <Label htmlFor="notify_team" className="font-normal">Notificar al equipo</Label>
                            </div>
                        </div>
                    </div>

                    {/* Observations */}
                    <div className="space-y-2">
                        <Label htmlFor="observations">Observaciones</Label>
                        <Textarea
                            id="observations"
                            value={formData.observations}
                            onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                            placeholder="Notas adicionales..."
                            rows={3}
                        />
                    </div>

                    {/* Files */}
                    <div className="border-t pt-4">
                        <Label className="block mb-3">Archivos Adjuntos</Label>
                        <ModelAttachments
                            ref={attachmentsRef}
                            areaSlug="marketing"
                            modelId={activeStrategy?.id}
                            modelType="App\Models\Strategy"
                            initialFiles={activeStrategy?.files || []}
                            onUpdate={() => {
                                if (activeStrategy?.id) {
                                    queryClient.invalidateQueries({ queryKey: ["strategy", activeStrategy.id] });
                                    queryClient.invalidateQueries({ queryKey: ["strategies"] });
                                }
                            }}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? (isEdit ? "Actualizando..." : "Guardando...") : (isEdit ? "Actualizar" : "Guardar")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
