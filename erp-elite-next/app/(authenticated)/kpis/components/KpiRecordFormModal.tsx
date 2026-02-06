"use client";

import { useEffect, useState, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { DateService } from "@/lib/date-service";
// Removed ModelAttachmentsCreator
import ModelAttachments, { ModelAttachmentsRef } from "@/components/cloud/ModelAttachments";
import { useQueryClient } from "@tanstack/react-query";

interface Kpi {
    id: number;
    indicatorName: string;
    protocolCode: string;
    targetValue: number | null;
}

interface KpiRecord {
    id: number;
    recordDate: string;
    value: number;
    observation: string | null;
    files?: Array<{
        id: number;
        name: string;
        path: string;
        size: number | null;
        url: string;
    }>;
}

interface KpiRecordFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    kpi: Kpi;
    recordToEdit?: KpiRecord;
    onSuccess: () => void;
}

export function KpiRecordFormModal({
    open,
    onOpenChange,
    kpi,
    recordToEdit,
    onSuccess,
}: KpiRecordFormModalProps) {
    const queryClient = useQueryClient();
    const attachmentsRef = useRef<ModelAttachmentsRef>(null);

    const [formData, setFormData] = useState({
        record_date: DateService.todayInput(),
        value: "",
        observation: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            if (recordToEdit) {
                setFormData({
                    record_date: recordToEdit.recordDate.split("T")[0],
                    value: recordToEdit.value.toString(),
                    observation: recordToEdit.observation || "",
                });
            } else {
                setFormData({
                    record_date: DateService.todayInput(),
                    value: "",
                    observation: "",
                });
            }
        }
    }, [open, recordToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Upload files via ref
            const uploadedFileIds = await attachmentsRef.current?.upload() || [];

            const url = recordToEdit
                ? `/api/kpis/records/${recordToEdit.id}`
                : `/api/kpis/${kpi.id}/records`;
            const method = recordToEdit ? "PUT" : "POST";

            const payload = {
                record_date: formData.record_date,
                value: parseFloat(formData.value),
                observation: formData.observation,
                pending_file_ids: uploadedFileIds,
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Error al guardar el registro");
            }

            toast.success(
                recordToEdit
                    ? "Registro actualizado exitosamente"
                    : "Registro creado exitosamente"
            );

            // Invalidate queries to refresh list
            queryClient.invalidateQueries({ queryKey: ["kpi-records", kpi.id] });

            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("Ocurrió un error al guardar el registro");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {recordToEdit ? "Editar Registro" : "Nuevo Registro"}
                    </DialogTitle>
                </DialogHeader>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-4">
                    <h3 className="font-semibold text-gray-800">{kpi.indicatorName}</h3>
                    <div className="flex space-x-4 text-sm text-gray-600 mt-1">
                        <span>Código: <span className="font-medium">{kpi.protocolCode}</span></span>
                        <span>Meta: <span className="font-medium">{kpi.targetValue ?? 'N/A'}</span></span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="record_date">Fecha de Registro *</Label>
                            <Input
                                id="record_date"
                                type="date"
                                value={formData.record_date}
                                onChange={(e) =>
                                    setFormData({ ...formData, record_date: e.target.value })
                                }
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="value">Valor Obtenido *</Label>
                            <Input
                                id="value"
                                type="number"
                                step="0.01"
                                value={formData.value}
                                onChange={(e) =>
                                    setFormData({ ...formData, value: e.target.value })
                                }
                                placeholder="Ej: 95.5"
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <Label htmlFor="observation">Observación</Label>
                            <Textarea
                                id="observation"
                                value={formData.observation}
                                onChange={(e) =>
                                    setFormData({ ...formData, observation: e.target.value })
                                }
                                placeholder="Comentarios adicionales..."
                                rows={3}
                            />
                        </div>
                    </div>

                    <div className="pt-2 border-t mt-4">
                        <Label className="mb-2 block">Evidencias / Adjuntos</Label>
                        <ModelAttachments
                            ref={attachmentsRef}
                            areaSlug="kpis"
                            initialFiles={recordToEdit?.files || []}
                            modelId={recordToEdit?.id}
                            modelType="App\Models\KpiRecord"
                            onUpdate={() => {
                                queryClient.invalidateQueries({ queryKey: ["kpi-records", kpi.id] });
                            }}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Guardando..." : (recordToEdit ? "Actualizar Registro" : "Guardar Registro")}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
