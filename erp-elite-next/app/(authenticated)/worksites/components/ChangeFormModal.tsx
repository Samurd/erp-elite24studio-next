"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RichSelect } from "@/components/ui/rich-select";
import { DateService } from "@/lib/date-service";
import ModelAttachments, { ModelAttachmentsRef } from "@/components/cloud/ModelAttachments";

const changeSchema = z.object({
    change_date: z.string().min(1, "La fecha es requerida"),
    change_type_id: z.string().min(1, "El tipo es requerido"),
    requested_by: z.string().optional(),
    description: z.string().min(1, "La descripción es requerida"),
    budget_impact_id: z.string().optional(),
    status_id: z.string().optional(),
    approved_by: z.string().optional(),
    internal_notes: z.string().optional(),
});

interface ChangeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    worksiteId: number;
    change?: any; // If present, edit mode
}

export function ChangeFormModal({
    isOpen,
    onClose,
    worksiteId,
    change,
}: ChangeFormModalProps) {
    const isEditing = !!change;
    const queryClient = useQueryClient();
    const attachmentsRef = useRef<ModelAttachmentsRef>(null);

    // Fetch full change details including files
    const { data: fetchedChange, isLoading } = useQuery({
        queryKey: ["worksite-change", change?.id],
        queryFn: async () => {
            if (!change?.id) return null;
            const res = await fetch(`/api/worksites/${worksiteId}/changes/${change.id}`);
            if (!res.ok) throw new Error("Failed to fetch change");
            return res.json();
        },
        enabled: isOpen && !!change?.id,
    });

    const activeChange = fetchedChange || change;

    const form = useForm<z.infer<typeof changeSchema>>({
        resolver: zodResolver(changeSchema),
        defaultValues: {
            change_date: DateService.todayInput(),
            change_type_id: "",
            requested_by: "",
            description: "",
            budget_impact_id: "none",
            status_id: "none",
            approved_by: "none",
            internal_notes: "",
        },
    });

    // Reset/Populate form on open or when activeChange updates
    useEffect(() => {
        if (isOpen) {
            if (activeChange) {
                form.reset({
                    change_date: DateService.toInput(activeChange.changeDate),
                    change_type_id: activeChange.changeTypeId?.toString() || activeChange.type?.id?.toString() || "",
                    requested_by: activeChange.requestedBy || "",
                    description: activeChange.description || "",
                    budget_impact_id: activeChange.budgetImpactId?.toString() || "none",
                    status_id: activeChange.statusId?.toString() || "none",
                    approved_by: activeChange.approvedBy?.toString() || "none",
                    internal_notes: activeChange.internalNotes || "",
                });
            } else {
                form.reset({
                    change_date: DateService.todayInput(),
                    change_type_id: "",
                    requested_by: "",
                    description: "",
                    budget_impact_id: "none",
                    status_id: "none",
                    approved_by: "none",
                    internal_notes: "",
                });
            }
        }
    }, [isOpen, activeChange, form]);

    useEffect(() => {
        if (!isOpen) {
            // Reset logic if needed
        }
    }, [isOpen]);


    // Fetch Options
    const { data: options } = useQuery({
        queryKey: ["worksites-options"],
        queryFn: async () => {
            const res = await fetch("/api/worksites/options");
            if (!res.ok) throw new Error("Failed to fetch options");
            return res.json();
        },
        enabled: isOpen,
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: async (values: z.infer<typeof changeSchema>) => {
            const allFileIds = await attachmentsRef.current?.upload() || [];
            const payload = { ...values, pending_file_ids: allFileIds };

            const res = await fetch(`/api/worksites/${worksiteId}/changes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Failed to create change");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Cambio creado exitosamente");
            queryClient.invalidateQueries({ queryKey: ["worksite-changes", worksiteId] });
            onClose();
        },
        onError: () => toast.error("Error al crear el cambio"),
    });

    const updateMutation = useMutation({
        mutationFn: async (values: z.infer<typeof changeSchema>) => {
            const allFileIds = await attachmentsRef.current?.upload() || [];
            const payload = { ...values, pending_file_ids: allFileIds };

            const res = await fetch(`/api/worksites/${worksiteId}/changes/${change.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Failed to update change");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Cambio actualizado exitosamente");
            queryClient.invalidateQueries({ queryKey: ["worksite-changes", worksiteId] });
            onClose();
        },
        onError: () => toast.error("Error al actualizar el cambio"),
    });

    const onSubmit = (values: z.infer<typeof changeSchema>) => {
        if (isEditing) {
            updateMutation.mutate(values);
        } else {
            createMutation.mutate(values);
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Editar Cambio" : "Nuevo Cambio"}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Date */}
                            <FormField
                                control={form.control}
                                name="change_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Type */}
                            <FormField
                                control={form.control}
                                name="change_type_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Cambio <span className="text-red-500">*</span></FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar tipo" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {options?.changeTypes?.map((type: any) => (
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

                            {/* Requested By */}
                            <div className="md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name="requested_by"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Solicitado Por</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nombre del solicitante" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Description */}
                            <div className="md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Descripción <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Detalles del cambio..." {...field} rows={4} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Budget Impact */}
                            <FormField
                                control={form.control}
                                name="budget_impact_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Impacto en Presupuesto</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar impacto" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">Seleccionar impacto</SelectItem>
                                                {options?.budgetImpacts?.map((impact: any) => (
                                                    <SelectItem key={impact.id} value={impact.id.toString()}>
                                                        {impact.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Status */}
                            <FormField
                                control={form.control}
                                name="status_id"
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
                                                {options?.changeStatuses?.map((status: any) => (
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

                            {/* Approved By */}
                            <div className="md:col-span-2 relative z-20">
                                <FormField
                                    control={form.control}
                                    name="approved_by"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Aprobado Por</FormLabel>
                                            <FormControl>
                                                <RichSelect
                                                    options={options?.users || []}
                                                    value={field.value !== "none" ? field.value : undefined}
                                                    onValueChange={(val) => field.onChange(val?.toString() || "none")}
                                                    placeholder="Seleccionar aprobador"
                                                    showAvatar={true}
                                                    imageKey="profilePhotoUrl"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Internal Notes */}
                            <div className="md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name="internal_notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Notas Internas</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Notas internas..." {...field} rows={3} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>



                            {/* Attachments */}
                            <div className="md:col-span-2 space-y-2">
                                <FormLabel className="mb-2 block">Archivos Adjuntos</FormLabel>
                                <ModelAttachments
                                    ref={attachmentsRef}
                                    areaSlug="obras"
                                    initialFiles={activeChange?.files || []}
                                    modelId={activeChange?.id}
                                    modelType="App\Models\WorksiteChange"
                                    onUpdate={() => {
                                        if (activeChange?.id) {
                                            queryClient.invalidateQueries({ queryKey: ["worksite-change", activeChange.id] });
                                            queryClient.invalidateQueries({ queryKey: ["worksite-changes", worksiteId] });
                                        }
                                    }}
                                />
                            </div>

                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? "Actualizar" : "Guardar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog >
    );
}
