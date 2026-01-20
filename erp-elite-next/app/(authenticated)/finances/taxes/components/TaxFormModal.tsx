"use client";

import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichSelect } from "@/components/ui/rich-select";
import MoneyInput from "@/components/ui/money-input";
import { toast } from "sonner";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import ModelAttachmentsCreator from "@/components/cloud/ModelAttachmentsCreator";
import ModelAttachments from "@/components/cloud/ModelAttachments";
import { DateService } from "@/lib/date-service";

interface TaxFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    record?: any; // If provided, we are in edit mode
    readOnly?: boolean;
}

export default function TaxFormModal({ isOpen, onClose, record, readOnly = false }: TaxFormModalProps) {
    const queryClient = useQueryClient();
    const isEditing = !!record;
    const [pendingCloudFiles, setPendingCloudFiles] = useState<any[]>([]);
    const [files, setFiles] = useState<File[]>([]);

    // Fetch full tax record details including files when editing/viewing
    const { data: fetchedRecord, isLoading: isLoadingRecord } = useQuery({
        queryKey: ["tax-record", record?.id],
        queryFn: async () => {
            if (!record?.id) return null;
            const res = await fetch(`/api/finances/taxes/${record.id}`);
            if (!res.ok) throw new Error("Failed to fetch tax record");
            return res.json();
        },
        enabled: isOpen && !!record?.id && (isEditing || readOnly),
    });

    // Use fetched record if available, otherwise use the passed record
    const activeRecord = fetchedRecord || record;

    const form = useForm({
        defaultValues: {
            entity: "",
            type_id: "",
            status_id: "",
            base: 0,
            porcentage: 0,
            amount: 0,
            date: DateService.todayInput(),
            observations: "",
        }
    });

    useEffect(() => {
        if (isOpen) {
            if (activeRecord) {
                form.reset({
                    entity: activeRecord.entity,
                    type_id: activeRecord.typeId?.toString() || "",
                    status_id: activeRecord.statusId?.toString() || "",
                    base: Number(activeRecord.base),
                    porcentage: Number(activeRecord.porcentage),
                    amount: Number(activeRecord.amount),
                    date: DateService.toInput(activeRecord.date),
                    observations: activeRecord.observations || "",
                });
                // Files are handled by ModelAttachments component which fetches its own data or uses record.files via initialFiles
            } else {
                form.reset({
                    entity: "",
                    type_id: "",
                    status_id: "",
                    base: 0,
                    porcentage: 0,
                    amount: 0,
                    date: DateService.todayInput(),
                    observations: "",
                });
                setFiles([]);
                setPendingCloudFiles([]);
            }
        }
    }, [isOpen, activeRecord, form]);

    const { data: typeOptions = [] } = useQuery({
        queryKey: ["tags", "tipo_impuesto"],
        queryFn: async () => {
            const res = await fetch("/api/tags/options?slug=tipo_impuesto");
            return res.json();
        }
    });

    const { data: statusOptions = [] } = useQuery({
        queryKey: ["tags", "estado_impuesto"],
        queryFn: async () => {
            const res = await fetch("/api/tags/options?slug=estado_impuesto");
            return res.json();
        }
    });

    // Calculate amount automatically if base and percentage change
    const base = form.watch("base");
    const percentage = form.watch("porcentage");

    useEffect(() => {
        if (!readOnly && base && percentage) {
            const calculatedAmount = (base * percentage) / 100;
            form.setValue("amount", Math.floor(calculatedAmount));
        }
    }, [base, percentage, readOnly, form]);


    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const url = isEditing ? `/api/finances/taxes/${record.id}` : "/api/finances/taxes";
            const method = isEditing ? "PUT" : "POST";

            let uploadedFileIds: number[] = [];

            // Upload new files if any
            if (files.length > 0) {
                const { uploadFile } = await import("@/actions/files");
                for (const file of files) {
                    const formData = new FormData();
                    formData.append('file', file);
                    const res = await uploadFile(formData);
                    if (res.success && res.file) {
                        uploadedFileIds.push(res.file.id);
                    }
                }
            }

            // Combine uploaded IDs with pending cloud file IDs
            const pendingIds = pendingCloudFiles.map(f => f.id);
            const allFileIds = [...uploadedFileIds, ...pendingIds];

            const payload = {
                ...data,
                pending_file_ids: allFileIds
            };

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to save tax record");
            }

            return response.json();
        },
        onSuccess: () => {
            toast.success(isEditing ? "Impuesto actualizado" : "Impuesto creado");
            queryClient.invalidateQueries({ queryKey: ["taxes"] });
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
                    <DialogTitle>{readOnly ? 'Detalle del Impuesto' : (isEditing ? 'Editar Impuesto' : 'Crear Impuesto')}</DialogTitle>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
                    {/* Entidad */}
                    <div>
                        <Label htmlFor="entity">Entidad <span className="text-red-500">*</span></Label>
                        <Input
                            id="entity"
                            {...form.register("entity", { required: true })}
                            placeholder="Nombre de la entidad"
                            disabled={readOnly}
                        />
                        {form.formState.errors.entity && <span className="text-red-500 text-sm">Este campo es requerido</span>}
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

                    {/* Base */}
                    <div>
                        <Label>Base</Label>
                        <MoneyInput
                            value={form.watch("base")}
                            onChange={(val) => form.setValue("base", val)}
                            disabled={readOnly}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Porcentaje */}
                        <div>
                            <Label htmlFor="porcentage">Porcentaje (%) <span className="text-red-500">*</span></Label>
                            <Input
                                id="porcentage"
                                type="number"
                                min="0"
                                max="100"
                                {...form.register("porcentage", { required: true, valueAsNumber: true })}
                                disabled={readOnly}
                            />
                        </div>

                        {/* Fecha */}
                        <div>
                            <Label htmlFor="date">Fecha <span className="text-red-500">*</span></Label>
                            <Input
                                id="date"
                                type="date"
                                {...form.register("date", { required: true })}
                                disabled={readOnly}
                            />
                        </div>
                    </div>

                    {/* Monto */}
                    <div>
                        <Label>Monto Total</Label>
                        <MoneyInput
                            value={form.watch("amount")}
                            onChange={(val) => form.setValue("amount", val)}
                            disabled={readOnly}
                        />
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
                        {isEditing || readOnly ? (
                            <ModelAttachments
                                initialFiles={activeRecord?.files || []}
                                modelId={activeRecord?.id}
                                modelType="App\Models\TaxRecord"
                                onUpdate={() => {
                                    queryClient.invalidateQueries({ queryKey: ["taxes"] });
                                    queryClient.invalidateQueries({ queryKey: ["tax-record", activeRecord?.id] });
                                }}
                            />
                        ) : (
                            <ModelAttachmentsCreator
                                files={files}
                                onFilesChange={setFiles}
                                pendingCloudFiles={pendingCloudFiles}
                                onPendingCloudFilesChange={setPendingCloudFiles}
                            />
                        )}
                    </div>

                    <DialogFooter>
                        {!readOnly && (
                            <>
                                <Button type="button" variant="outline" onClick={onClose}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={mutation.isPending}>
                                    {isEditing ? 'Actualizar' : 'Crear'}
                                </Button>
                            </>
                        )}
                        {readOnly && (
                            <Button type="button" onClick={onClose}>
                                Cerrar
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
