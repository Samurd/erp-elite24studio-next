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
import ModelAttachments, { ModelAttachmentsRef } from "@/components/cloud/ModelAttachments";

const punchItemSchema = z.object({
    observations: z.string().min(1, "Las observaciones son requeridas"),
    responsible_id: z.string().optional(),
    status_id: z.string().optional(),
});

interface PunchItemFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    worksiteId: number;
    punchItem?: any; // If present, edit mode
}

export function PunchItemFormModal({
    isOpen,
    onClose,
    worksiteId,
    punchItem,
}: PunchItemFormModalProps) {
    const isEditing = !!punchItem;
    const queryClient = useQueryClient();
    const attachmentsRef = useRef<ModelAttachmentsRef>(null);

    // Fetch full punch item details including files
    const { data: fetchedPunchItem, isLoading } = useQuery({
        queryKey: ["worksite-punch-item", punchItem?.id],
        queryFn: async () => {
            if (!punchItem?.id) return null;
            const res = await fetch(`/api/worksites/${worksiteId}/punch-items/${punchItem.id}`);
            if (!res.ok) throw new Error("Failed to fetch punch item");
            return res.json();
        },
        enabled: isOpen && !!punchItem?.id,
    });

    const activePunchItem = fetchedPunchItem || punchItem;

    const form = useForm<z.infer<typeof punchItemSchema>>({
        resolver: zodResolver(punchItemSchema),
        defaultValues: {
            observations: "",
            responsible_id: "none",
            status_id: "none",
        },
    });

    // Reset/Populate form on open or when activePunchItem updates
    useEffect(() => {
        if (isOpen) {
            if (activePunchItem) {
                form.reset({
                    observations: activePunchItem.observations || "",
                    responsible_id: activePunchItem.responsibleId?.toString() || "none",
                    status_id: activePunchItem.statusId?.toString() || "none",
                });
            } else {
                form.reset({
                    observations: "",
                    responsible_id: "none",
                    status_id: "none",
                });
            }
        }
    }, [isOpen, activePunchItem, form]);

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
        mutationFn: async (values: z.infer<typeof punchItemSchema>) => {
            const allFileIds = await attachmentsRef.current?.upload() || [];
            const payload = { ...values, pending_file_ids: allFileIds };

            const res = await fetch(`/api/worksites/${worksiteId}/punch-items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Failed to create punch item");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Punch Item creado exitosamente");
            queryClient.invalidateQueries({ queryKey: ["worksite-punch-items", worksiteId] });
            onClose();
        },
        onError: () => toast.error("Error al crear el punch item"),
    });

    const updateMutation = useMutation({
        mutationFn: async (values: z.infer<typeof punchItemSchema>) => {
            const allFileIds = await attachmentsRef.current?.upload() || [];
            const payload = { ...values, pending_file_ids: allFileIds };

            const res = await fetch(`/api/worksites/${worksiteId}/punch-items/${punchItem.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Failed to update punch item");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Punch Item actualizado exitosamente");
            queryClient.invalidateQueries({ queryKey: ["worksite-punch-items", worksiteId] });
            onClose();
        },
        onError: () => toast.error("Error al actualizar el punch item"),
    });

    const onSubmit = (values: z.infer<typeof punchItemSchema>) => {
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
                        {isEditing ? "Editar Punch Item" : "Nuevo Punch Item"}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

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
                                                {options?.punchItemStatuses?.map((status: any) => (
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

                            {/* Responsible */}
                            <FormField
                                control={form.control}
                                name="responsible_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Responsable</FormLabel>
                                        <FormControl>
                                            <RichSelect
                                                options={options?.users || []}
                                                value={field.value !== "none" ? field.value : undefined}
                                                onValueChange={(val) => field.onChange(val?.toString() || "none")}
                                                placeholder="Seleccionar responsable"
                                                showAvatar={true}
                                                imageKey="profilePhotoUrl"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Observations */}
                            <div className="md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name="observations"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Observaciones <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Detalles del punch item..." {...field} rows={6} />
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
                                    initialFiles={activePunchItem?.files || []}
                                    modelId={activePunchItem?.id}
                                    modelType="App\Models\PunchItem"
                                    onUpdate={() => {
                                        if (activePunchItem?.id) {
                                            queryClient.invalidateQueries({ queryKey: ["worksite-punch-item", activePunchItem.id] });
                                            queryClient.invalidateQueries({ queryKey: ["worksite-punch-items", worksiteId] });
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
        </Dialog>
    );
}
