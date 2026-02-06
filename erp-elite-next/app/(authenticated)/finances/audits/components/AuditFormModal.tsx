"use client";

import { useForm } from "react-hook-form";
import { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichSelect } from "@/components/ui/rich-select";
import { toast } from "sonner";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
// Removed ModelAttachmentsCreator
import ModelAttachments, { ModelAttachmentsRef } from "@/components/cloud/ModelAttachments";
import { DateService } from "@/lib/date-service";

interface AuditFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    record?: any;
    readOnly?: boolean;
}

export default function AuditFormModal({ isOpen, onClose, record, readOnly = false }: AuditFormModalProps) {
    const queryClient = useQueryClient();
    const isEditing = !!record;
    const attachmentsRef = useRef<ModelAttachmentsRef>(null);

    // Fetch full audit record details including files when editing/viewing
    const { data: fetchedRecord, isLoading: isLoadingRecord } = useQuery({
        queryKey: ["audit-record", record?.id],
        queryFn: async () => {
            if (!record?.id) return null;
            const res = await fetch(`/api/finances/audits/${record.id}`);
            if (!res.ok) throw new Error("Failed to fetch audit record");
            return res.json();
        },
        enabled: isOpen && !!record?.id && (isEditing || readOnly),
    });

    // Use fetched record if available, otherwise use the passed record
    const activeRecord = fetchedRecord || record;

    const form = useForm({
        defaultValues: {
            date_register: DateService.todayInput(),
            date_audit: DateService.todayInput(),
            objective: 0,
            type_id: "",
            place: "",
            status_id: "",
            observations: "",
        }
    });

    useEffect(() => {
        if (isOpen) {
            if (activeRecord) {
                form.reset({
                    date_register: DateService.toInput(activeRecord.dateRegister),
                    date_audit: DateService.toInput(activeRecord.dateAudit),
                    objective: Number(activeRecord.objective),
                    type_id: activeRecord.typeId?.toString() || "",
                    place: activeRecord.place || "",
                    status_id: activeRecord.statusId?.toString() || "",
                    observations: activeRecord.observations || "",
                });
            } else {
                form.reset({
                    date_register: DateService.todayInput(),
                    date_audit: DateService.todayInput(),
                    objective: 0,
                    type_id: "",
                    place: "",
                    status_id: "",
                    observations: "",
                });
            }
        }
    }, [isOpen, activeRecord, form]);

    const { data: typeOptions = [] } = useQuery({
        queryKey: ["tags", "tipo_auditoria"],
        queryFn: async () => {
            const res = await fetch("/api/tags/options?slug=tipo_auditoria");
            return res.json();
        }
    });

    const { data: statusOptions = [] } = useQuery({
        queryKey: ["tags", "estado_auditoria"],
        queryFn: async () => {
            const res = await fetch("/api/tags/options?slug=estado_auditoria");
            return res.json();
        }
    });

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const url = isEditing ? `/api/finances/audits/${record.id}` : "/api/finances/audits";
            const method = isEditing ? "PUT" : "POST";

            // Upload files via ref
            const uploadedFileIds = await attachmentsRef.current?.upload() || [];

            const payload = {
                ...data,
                pending_file_ids: uploadedFileIds
            };

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to save audit record");
            }

            return response.json();
        },
        onSuccess: () => {
            toast.success(isEditing ? "Auditoría actualizada" : "Auditoría creada");
            queryClient.invalidateQueries({ queryKey: ["audits"] });
            onClose();
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const onSubmit = (data: any) => {
        mutation.mutate(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{readOnly ? 'Detalle de la Auditoría' : (isEditing ? 'Editar Auditoría' : 'Crear Auditoría')}</DialogTitle>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Fecha de Registro */}
                        <div>
                            <Label htmlFor="date_register">Fecha de Registro <span className="text-red-500">*</span></Label>
                            <Input
                                id="date_register"
                                type="date"
                                {...form.register("date_register", { required: true })}
                                disabled={readOnly}
                            />
                            {form.formState.errors.date_register && <span className="text-red-500 text-sm">Este campo es requerido</span>}
                        </div>

                        {/* Fecha de Auditoría */}
                        <div>
                            <Label htmlFor="date_audit">Fecha de Auditoría <span className="text-red-500">*</span></Label>
                            <Input
                                id="date_audit"
                                type="date"
                                {...form.register("date_audit", { required: true })}
                                disabled={readOnly}
                            />
                            {form.formState.errors.date_audit && <span className="text-red-500 text-sm">Este campo es requerido</span>}
                        </div>
                    </div>

                    {/* Objetivo */}
                    <div>
                        <Label htmlFor="objective">Objetivo <span className="text-red-500">*</span></Label>
                        <Input
                            id="objective"
                            type="number"
                            min="0"
                            {...form.register("objective", { required: true, min: 0 })}
                            placeholder="Objetivo numérico"
                            disabled={readOnly}
                        />
                        {form.formState.errors.objective && <span className="text-red-500 text-sm">Este campo es requerido</span>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Tipo */}
                        <div>
                            <Label>Tipo</Label>
                            <RichSelect
                                placeholder="Seleccionar tipo"
                                value={form.watch("type_id")}
                                onValueChange={(val) => form.setValue("type_id", val)}
                                options={typeOptions}
                                disabled={readOnly}
                                showAvatar={false}
                            />
                        </div>

                        {/* Estado */}
                        <div>
                            <Label>Estado</Label>
                            <RichSelect
                                placeholder="Seleccionar estado"
                                value={form.watch("status_id")}
                                onValueChange={(val) => form.setValue("status_id", val)}
                                options={statusOptions}
                                disabled={readOnly}
                                showAvatar={false}
                            />
                        </div>
                    </div>

                    {/* Lugar */}
                    <div>
                        <Label htmlFor="place">Lugar <span className="text-red-500">*</span></Label>
                        <Input
                            id="place"
                            {...form.register("place", { required: true })}
                            placeholder="Lugar de la auditoría"
                            disabled={readOnly}
                        />
                        {form.formState.errors.place && <span className="text-red-500 text-sm">Este campo es requerido</span>}
                    </div>

                    {/* Observaciones */}
                    <div>
                        <Label htmlFor="observations">Observaciones</Label>
                        <Textarea
                            id="observations"
                            rows={4}
                            {...form.register("observations")}
                            placeholder="Agregue sus observaciones..."
                            disabled={readOnly}
                        />
                    </div>

                    {/* Archivos Adjuntos */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold mb-4">Archivos Adjuntos</h3>
                        <ModelAttachments
                            ref={attachmentsRef}
                            areaSlug={typeOptions.find((t: any) => t.id.toString() === form.watch("type_id"))?.slug || "finanzas"}
                            initialFiles={activeRecord?.files || []}
                            modelId={activeRecord?.id}
                            modelType="App\Models\Audit"
                            onUpdate={() => {
                                queryClient.invalidateQueries({ queryKey: ["audits"] });
                                if (activeRecord?.id) {
                                    queryClient.invalidateQueries({ queryKey: ["audit-record", activeRecord?.id] });
                                }
                            }}
                        />
                    </div>

                    {!readOnly && (
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending ? "Guardando..." : (isEditing ? "Actualizar" : "Crear")}
                            </Button>
                        </DialogFooter>
                    )}
                </form>
            </DialogContent>
        </Dialog>
    );
}
