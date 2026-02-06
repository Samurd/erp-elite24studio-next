
"use client";

import { useEffect } from "react";
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
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import { useRef } from "react";

const visitSchema = z.object({
    visit_date: z.string().min(1, "La fecha es requerida"),
    performed_by: z.string().optional(),
    status_id: z.string().optional(),
    general_observations: z.string().optional(),
    internal_notes: z.string().optional(),
});

interface VisitFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    worksiteId: number;
    visit?: any; // If present, edit mode
}

export function VisitFormModal({
    isOpen,
    onClose,
    worksiteId,
    visit,
}: VisitFormModalProps) {
    const isEditing = !!visit;
    const queryClient = useQueryClient();
    const attachmentsRef = useRef<ModelAttachmentsRef>(null);

    // Fetch full visit details if editing
    const { data: fetchedVisit, isLoading } = useQuery({
        queryKey: ["worksite-visit", visit?.id],
        queryFn: async () => {
            if (!visit?.id) return null;
            const res = await fetch(`/api/worksites/${worksiteId}/visits/${visit.id}`);
            if (!res.ok) throw new Error("Failed to fetch visit");
            return res.json();
        },
        enabled: isOpen && !!visit?.id,
    });

    const activeVisit = fetchedVisit || visit;

    const form = useForm<z.infer<typeof visitSchema>>({
        resolver: zodResolver(visitSchema),
        defaultValues: {
            visit_date: DateService.todayInput(),
            performed_by: "none",
            status_id: "none",
            general_observations: "",
            internal_notes: "",
        },
    });

    // Reset/Populate form on open or when activeVisit updates
    useEffect(() => {
        if (isOpen) {
            if (activeVisit) {
                form.reset({
                    visit_date: DateService.toInput(activeVisit.visitDate),
                    performed_by: activeVisit.performedBy?.toString() || "none",
                    status_id: activeVisit.statusId?.toString() || "none",
                    general_observations: activeVisit.generalObservations || "",
                    internal_notes: activeVisit.internalNotes || "",
                });
            } else {
                form.reset({
                    visit_date: DateService.todayInput(),
                    performed_by: "none",
                    status_id: "none",
                    general_observations: "",
                    internal_notes: "",
                });
            }
        }
    }, [isOpen, activeVisit, form]);

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
        mutationFn: async (values: z.infer<typeof visitSchema>) => {
            const allFileIds = await attachmentsRef.current?.upload() || [];
            const payload = { ...values, pending_file_ids: allFileIds };

            const res = await fetch(`/api/worksites/${worksiteId}/visits`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Failed to create visit");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Visita creada exitosamente");
            queryClient.invalidateQueries({ queryKey: ["worksite-visits", worksiteId] });
            onClose();
        },
        onError: () => toast.error("Error al crear la visita"),
    });

    const updateMutation = useMutation({
        mutationFn: async (values: z.infer<typeof visitSchema>) => {
            const allFileIds = await attachmentsRef.current?.upload() || [];
            const payload = { ...values, pending_file_ids: allFileIds };

            const res = await fetch(`/api/worksites/${worksiteId}/visits/${visit.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Failed to update visit");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Visita actualizada exitosamente");
            queryClient.invalidateQueries({ queryKey: ["worksite-visits", worksiteId] });
            onClose();
        },
        onError: () => toast.error("Error al actualizar la visita"),
    });

    const onSubmit = (values: z.infer<typeof visitSchema>) => {
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
                        {isEditing ? "Editar Visita" : "Nueva Visita"}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Visit Date */}
                            <FormField
                                control={form.control}
                                name="visit_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha de Visita <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
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
                                                {options?.visitStatusOptions?.map((status: any) => (
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

                            {/* Visitor (Performed By) */}
                            <FormField
                                control={form.control}
                                name="performed_by"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Visita Realizada Por</FormLabel>
                                        <FormControl>
                                            <RichSelect
                                                options={options?.users || []}
                                                value={field.value !== "none" ? field.value : undefined}
                                                onValueChange={(val) => field.onChange(val?.toString() || "none")}
                                                placeholder="Seleccionar visitante"
                                                showAvatar={true}
                                                imageKey="profilePhotoUrl"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* General Observations */}
                            <div className="md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name="general_observations"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Observaciones Generales</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Observaciones..." {...field} rows={3} />
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

                        </div>

                        {/* Attachments */}
                        <div className="md:col-span-2 space-y-2">
                            <FormLabel className="mb-2 block">Archivos Adjuntos</FormLabel>
                            <ModelAttachments
                                ref={attachmentsRef}
                                areaSlug="obras"
                                initialFiles={activeVisit?.files || []}
                                modelId={activeVisit?.id}
                                modelType="App\Models\WorksiteVisit"
                                onUpdate={() => {
                                    if (activeVisit?.id) {
                                        queryClient.invalidateQueries({ queryKey: ["worksite-visit", activeVisit.id] });
                                        queryClient.invalidateQueries({ queryKey: ["worksite-visits", worksiteId] });
                                    }
                                }}
                            />
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
