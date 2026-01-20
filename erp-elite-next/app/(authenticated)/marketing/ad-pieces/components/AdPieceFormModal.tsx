'use client';

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Image } from "lucide-react";
import ModelAttachmentsCreator from "@/components/cloud/ModelAttachmentsCreator";
import ModelAttachments from "@/components/cloud/ModelAttachments";

interface AdPieceFormModalProps {
    open: boolean;
    onClose: () => void;
    data?: any | null; // If null, it's create mode
    typeOptions: any[];
    formatOptions: any[];
    statusOptions: any[];
    projectOptions: any[];
    teamOptions: any[];
    strategyOptions: any[];
}

export default function AdPieceFormModal({ open, onClose, data, typeOptions, formatOptions, statusOptions, projectOptions, teamOptions, strategyOptions }: AdPieceFormModalProps) {
    const isEdit = !!data;
    const queryClient = useQueryClient();
    const [currentData, setCurrentData] = useState(data);

    const [formData, setFormData] = useState({
        name: "",
        type_id: "",
        format_id: "",
        status_id: "",
        media: "",
        project_id: "",
        team_id: "",
        strategy_id: "",
        instructions: "",
        files: [] as File[],
        pending_file_ids: [] as number[],
    });

    // Fetch full data when modal opens in edit mode
    useEffect(() => {
        const fetchFullData = async () => {
            if (data && isEdit && data.id && open) {
                try {
                    const res = await fetch(`/api/marketing/ad-pieces/${data.id}`);
                    if (res.ok) {
                        const fullData = await res.json();
                        setCurrentData(fullData);
                    }
                } catch (error) {
                    console.error("Error fetching full ad piece data:", error);
                    setCurrentData(data);
                }
            } else {
                setCurrentData(data);
            }
        };

        fetchFullData();
    }, [data, isEdit, open]);

    // Update form data when currentData changes
    useEffect(() => {
        if (currentData && isEdit) {
            setFormData({
                name: currentData.name || "",
                type_id: currentData.typeId ? currentData.typeId.toString() : "",
                format_id: currentData.formatId ? currentData.formatId.toString() : "",
                status_id: currentData.statusId ? currentData.statusId.toString() : "",
                media: currentData.media || "",
                project_id: currentData.projectId ? currentData.projectId.toString() : "",
                team_id: currentData.teamId ? currentData.teamId.toString() : "",
                strategy_id: currentData.strategyId ? currentData.strategyId.toString() : "",
                instructions: currentData.instructions || "",
                files: [],
                pending_file_ids: [],
            });
        } else if (!isEdit) {
            setFormData({
                name: "",
                type_id: "",
                format_id: "",
                status_id: "",
                media: "",
                project_id: "",
                team_id: "",
                strategy_id: "",
                instructions: "",
                files: [],
                pending_file_ids: [],
            });
        }
    }, [currentData, isEdit]);

    const refreshData = async () => {
        if (currentData?.id) {
            try {
                const res = await fetch(`/api/marketing/ad-pieces/${currentData.id}`);
                if (res.ok) {
                    const freshData = await res.json();
                    setCurrentData(freshData);
                }
            } catch (error) {
                console.error("Error refreshing ad piece data:", error);
            }
        }
    };

    const mutation = useMutation({
        mutationFn: async (submitData: typeof formData) => {
            const url = isEdit ? `/api/marketing/ad-pieces/${data.id}` : "/api/marketing/ad-pieces";
            const method = isEdit ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(submitData),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Error saving ad piece");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["marketing-ad-pieces"] });
            toast.success(isEdit ? "Pieza actualizada" : "Pieza creada");
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
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                            <Image className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle>{isEdit ? "Editar Pieza Publicitaria" : "Nueva Pieza Publicitaria"}</DialogTitle>
                            <DialogDescription>
                                {isEdit ? "Actualiza la información de la pieza" : "Complete los datos para registrar una nueva pieza"}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="name">Nombre *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Nombre de la pieza"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status_id">Estado</Label>
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

                    {/* Classification */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="type_id">Tipo</Label>
                            <Select value={formData.type_id} onValueChange={(val) => setFormData({ ...formData, type_id: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent>
                                    {typeOptions.map((option) => (
                                        <SelectItem key={option.id} value={option.id.toString()}>{option.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="format_id">Formato</Label>
                            <Select value={formData.format_id} onValueChange={(val) => setFormData({ ...formData, format_id: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent>
                                    {formatOptions.map((option) => (
                                        <SelectItem key={option.id} value={option.id.toString()}>{option.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="media">Medio</Label>
                            <Input
                                id="media"
                                value={formData.media}
                                onChange={(e) => setFormData({ ...formData, media: e.target.value })}
                                placeholder="Ej: Facebook"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="team_id">Equipo</Label>
                            <Select value={formData.team_id} onValueChange={(val) => setFormData({ ...formData, team_id: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent>
                                    {teamOptions.map((option) => (
                                        <SelectItem key={option.id} value={option.id.toString()}>{option.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Relations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="project_id">Proyecto</Label>
                            <Select value={formData.project_id} onValueChange={(val) => setFormData({ ...formData, project_id: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sin Proyecto" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projectOptions.map((project) => (
                                        <SelectItem key={project.id} value={project.id.toString()}>{project.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="strategy_id">Estrategia</Label>
                            <Select value={formData.strategy_id} onValueChange={(val) => setFormData({ ...formData, strategy_id: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sin Estrategia" />
                                </SelectTrigger>
                                <SelectContent>
                                    {strategyOptions.map((strategy) => (
                                        <SelectItem key={strategy.id} value={strategy.id.toString()}>{strategy.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="space-y-2">
                        <Label htmlFor="instructions">Instrucciones</Label>
                        <Textarea
                            id="instructions"
                            value={formData.instructions}
                            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                            placeholder="Instrucciones para la pieza..."
                            rows={5}
                        />
                    </div>

                    {/* Files */}
                    <div className="border-t pt-4">
                        <Label className="block mb-3">Archivos Adjuntos</Label>
                        {currentData && currentData.id ? (
                            <ModelAttachments
                                modelId={currentData.id}
                                modelType="App\Models\Adpiece"
                                initialFiles={currentData.files || []}
                                onUpdate={refreshData}
                            />
                        ) : (
                            <ModelAttachmentsCreator
                                files={formData.files}
                                onFilesChange={(files) => setFormData({ ...formData, files })}
                                pendingCloudFiles={formData.pending_file_ids as any}
                                onPendingCloudFilesChange={(files) => setFormData({ ...formData, pending_file_ids: files as any })}
                            />
                        )}
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
