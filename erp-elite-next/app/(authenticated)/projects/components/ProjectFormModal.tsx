"use client";

import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import ModelAttachments, { ModelAttachmentsRef } from "@/components/cloud/ModelAttachments";
import { RichSelect } from "@/components/ui/rich-select";

const projectSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    description: z.string().optional(),
    direction: z.string().optional(),
    contactId: z.string().optional(),
    statusId: z.string().optional(),
    projectTypeId: z.string().optional(),
    currentStageId: z.string().optional(),
    initialStageId: z.string().optional(),
    responsibleId: z.string().optional(),
    teamId: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface Stage {
    id: string | number;
    name: string;
    description?: string;
    isTemp?: boolean;
}

interface ProjectFormModalProps {
    projectId: number | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function ProjectFormModal({ projectId, onClose, onSuccess }: ProjectFormModalProps) {
    const queryClient = useQueryClient();
    const isEditing = !!projectId;
    const attachmentsRef = useRef<ModelAttachmentsRef>(null);

    const [managedStages, setManagedStages] = useState<Stage[]>([]);
    const [showStageForm, setShowStageForm] = useState(false);
    const [stageForm, setStageForm] = useState<{
        type: "new" | "edit";
        id: string | number | null;
        name: string;
        description: string;
    }>({ type: "new", id: null, name: "", description: "" });

    // Fetch options
    const { data: options } = useQuery({
        queryKey: ["projectOptions"],
        queryFn: async () => {
            const res = await fetch("/api/projects/options");
            if (!res.ok) throw new Error("Failed to fetch options");
            return res.json();
        },
    });

    // Fetch project data if editing
    const { data: project } = useQuery({
        queryKey: ["project", projectId],
        queryFn: async () => {
            const res = await fetch(`/api/projects/${projectId}`);
            if (!res.ok) throw new Error("Failed to fetch project");
            return res.json();
        },
        enabled: isEditing,
    });

    const form = useForm<ProjectFormData>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            name: "",
            description: "",
            direction: "",
            contactId: "none",
            statusId: "none",
            projectTypeId: "none",
            currentStageId: "none",
            initialStageId: "none",
            responsibleId: "none",
            teamId: "none",
        },
    });

    // Populate form when project data loads
    useEffect(() => {
        if (project && isEditing) {
            const formData = {
                name: project.name || "",
                description: project.description || "",
                direction: project.direction || "",
                contactId: project.contactId?.toString() || "none",
                statusId: project.statusId?.toString() || "none",
                projectTypeId: project.projectTypeId?.toString() || "none",
                currentStageId: project.currentStageId?.toString() || "none",
                responsibleId: project.responsibleId || "none",
                teamId: project.teamId?.toString() || "none",
            };

            form.reset(formData);

            // Load existing stages
            if (project.stages) {
                setManagedStages(
                    project.stages.map((stage: any) => ({
                        id: stage.id,
                        name: stage.name,
                        description: stage.description,
                        isTemp: false,
                    }))
                );
            }
        }
    }, [project, isEditing]);

    // Create mutation
    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to create project");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Proyecto creado exitosamente");
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            onSuccess();
        },
        onError: () => {
            toast.error("Error al crear el proyecto");
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`/api/projects/${projectId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to update project");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Proyecto actualizado exitosamente");
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["project", projectId] });
            onSuccess();
        },
        onError: () => {
            toast.error("Error al actualizar el proyecto");
        },
    });

    const onSubmit = async (data: ProjectFormData) => {
        // Convert 'none' values to null for optional fields
        const cleanedData = {
            ...data,
            contactId: data.contactId === "none" ? null : data.contactId,
            projectTypeId: data.projectTypeId === "none" ? null : data.projectTypeId,
            statusId: data.statusId === "none" ? null : data.statusId,
            currentStageId: data.currentStageId === "none" ? null : data.currentStageId,
            initialStageId: data.initialStageId === "none" ? null : data.initialStageId,
            responsibleId: data.responsibleId === "none" ? null : data.responsibleId,
            teamId: data.teamId === "none" ? null : data.teamId,
        };

        // Upload files
        const fileIds = await attachmentsRef.current?.upload() || [];

        // Determine if we should send pendingCloudFileIds (existing backend expectation) or pending_file_ids
        // Based on the old code: pendingCloudFileIds: pendingCloudFiles.map(f => f.id)
        // We will stick to that key for now.
        const payload = {
            ...cleanedData,
            pendingCloudFileIds: fileIds,
        };

        if (isEditing) {
            updateMutation.mutate({
                ...payload,
                managedStages,
            });
        } else {
            const tempStages = managedStages.filter((s) => s.isTemp);
            createMutation.mutate({
                ...payload,
                tempStages,
            });
        }
    };

    // Stage management functions
    const openStageForm = () => {
        setStageForm({ type: "new", id: null, name: "", description: "" });
        setShowStageForm(true);
    };

    const editStage = (stage: Stage) => {
        setStageForm({
            type: "edit",
            id: stage.id,
            name: stage.name,
            description: stage.description || "",
        });
        setShowStageForm(true);
    };

    const saveStage = () => {
        if (!stageForm.name) return;

        if (stageForm.type === "new") {
            const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            setManagedStages([
                ...managedStages,
                {
                    id: tempId,
                    name: stageForm.name,
                    description: stageForm.description,
                    isTemp: true,
                },
            ]);
        } else {
            setManagedStages(
                managedStages.map((s) =>
                    s.id === stageForm.id
                        ? { ...s, name: stageForm.name, description: stageForm.description }
                        : s
                )
            );
        }
        setShowStageForm(false);
    };

    const removeStage = (id: string | number) => {
        if (
            confirm(
                "¿Estás seguro de eliminar esta etapa? Si es una etapa existente, se eliminará al guardar el proyecto."
            )
        ) {
            setManagedStages(managedStages.filter((s) => s.id !== id));
        }
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="min-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Editar Proyecto" : "Nuevo Proyecto"}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Name */}
                            <div className="lg:col-span-2">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Nombre del Proyecto <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nombre del proyecto" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Contact */}
                            <div>
                                <FormField
                                    control={form.control}
                                    name="contactId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Contacto/Cliente</FormLabel>
                                            <FormControl>
                                                <RichSelect
                                                    options={options?.contacts || []}
                                                    value={field.value && field.value !== "none" ? parseInt(field.value) : undefined}
                                                    onValueChange={(val) => field.onChange(val ? val.toString() : "none")}
                                                    placeholder="Seleccionar contacto"
                                                    showAvatar={true}
                                                    imageKey="profile_photo_url" // Assuming contacts have this or similar, otherwise defaults
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Project Type */}
                            <div>
                                <FormField
                                    control={form.control}
                                    name="projectTypeId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tipo de Proyecto</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccionar tipo" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">Sin tipo</SelectItem>
                                                    {options?.projectTypeOptions?.map((type: any) => (
                                                        <SelectItem key={type.id} value={type.id.toString()}>
                                                            {type.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <FormField
                                    control={form.control}
                                    name="statusId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Estado</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccionar estado" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">Sin estado</SelectItem>
                                                    {options?.statusOptions?.map((status: any) => (
                                                        <SelectItem key={status.id} value={status.id.toString()}>
                                                            {status.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Stage */}
                            <div>
                                <FormField
                                    control={form.control}
                                    name={isEditing ? "currentStageId" : "initialStageId"}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{isEditing ? "Etapa Actual" : "Etapa Inicial"}</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccionar etapa" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">Sin etapa</SelectItem>
                                                    {managedStages.map((stage) => (
                                                        <SelectItem key={stage.id} value={stage.id.toString()}>
                                                            {stage.name} {stage.isTemp ? "(Nueva)" : ""}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Team */}
                            <div className="">
                                <FormField
                                    control={form.control}
                                    name="teamId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Equipo</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Sin equipo" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">Sin equipo</SelectItem>
                                                    {options?.teams?.map((team: any) => (
                                                        <SelectItem key={team.id} value={team.id.toString()}>
                                                            {team.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Responsible */}
                            <div className="">
                                <FormField
                                    control={form.control}
                                    name="responsibleId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Responsable</FormLabel>
                                            <FormControl>
                                                <RichSelect
                                                    options={options?.users || []}
                                                    value={field.value && field.value !== "none" ? field.value : undefined}
                                                    onValueChange={(val) => field.onChange(val ? val.toString() : "none")}
                                                    placeholder="Seleccionar responsable"
                                                    showAvatar={true}
                                                    imageKey="profile_photo_url"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>



                            {/* Direction */}
                            <div className="lg:col-span-3">
                                <FormField
                                    control={form.control}
                                    name="direction"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Dirección</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Dirección del proyecto" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Description */}
                            <div className="lg:col-span-3">
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Descripción</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Descripción detallada..."
                                                    rows={4}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Files */}
                        <div className="pt-6 border-t">
                            <h3 className="text-lg font-semibold mb-4">Archivos Adjuntos</h3>
                            <ModelAttachments
                                ref={attachmentsRef}
                                areaSlug="proyectos"
                                initialFiles={isEditing && project ? project.files || [] : []}
                                modelId={projectId || undefined}
                                modelType="Project"
                                onUpdate={() => {
                                    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
                                }}
                            />
                        </div>

                        {/* Stage Management */}
                        <div className="pt-6 border-t bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-gray-800">Gestión de Etapas</h2>
                                <Button type="button" onClick={openStageForm} variant="outline" size="sm">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nueva Etapa
                                </Button>
                            </div>

                            {/* Stage Form */}
                            {showStageForm && (
                                <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nombre de Etapa
                                            </label>
                                            <Input
                                                value={stageForm.name}
                                                onChange={(e) =>
                                                    setStageForm({ ...stageForm, name: e.target.value })
                                                }
                                                placeholder="Ej: Planificación"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Descripción
                                            </label>
                                            <Input
                                                value={stageForm.description}
                                                onChange={(e) =>
                                                    setStageForm({ ...stageForm, description: e.target.value })
                                                }
                                                placeholder="Breve descripción"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 mt-4">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => setShowStageForm(false)}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button type="button" onClick={saveStage}>
                                            Guardar en Lista
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Stage List */}
                            {managedStages.length > 0 ? (
                                <div className="space-y-2">
                                    {managedStages.map((stage) => (
                                        <div
                                            key={stage.id}
                                            className="flex items-center justify-between p-3 bg-white rounded border"
                                        >
                                            <div>
                                                <p className="font-medium text-gray-800">{stage.name}</p>
                                                <p className="text-xs text-gray-500">{stage.description}</p>
                                                {stage.isTemp && (
                                                    <span className="text-xs text-blue-500 font-semibold">
                                                        Nueva (Se guardará al guardar el proyecto)
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex space-x-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => editStage(stage)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeStage(stage.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 py-4">
                                    No hay etapas específicas definidas.
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-6 border-t">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={createMutation.isPending || updateMutation.isPending}
                            >
                                {isEditing ? "Actualizar Proyecto" : "Guardar Proyecto"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
