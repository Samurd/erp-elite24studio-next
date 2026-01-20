
"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { RichSelect } from "@/components/ui/rich-select";

interface Kpi {
    id: number;
    indicatorName: string;
    targetValue: number | null;
    periodicityDays: number;
    roleId: number | null;
    role?: { id: number; name: string } | null;
}

interface KpiFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    kpiToEdit?: Kpi;
    onSuccess: () => void;
    roles: Array<{ id: number; name: string }>;
}

export function KpiFormModal({
    open,
    onOpenChange,
    kpiToEdit,
    onSuccess,
    roles,
}: KpiFormModalProps) {
    const [formData, setFormData] = useState({
        indicator_name: "",
        target_value: "",
        periodicity_days: "30",
        role_id: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            if (kpiToEdit) {
                setFormData({
                    indicator_name: kpiToEdit.indicatorName,
                    target_value: kpiToEdit.targetValue?.toString() || "",
                    periodicity_days: kpiToEdit.periodicityDays.toString(),
                    role_id: kpiToEdit.roleId?.toString() || kpiToEdit.role?.id.toString() || "",
                });
            } else {
                setFormData({
                    indicator_name: "",
                    target_value: "",
                    periodicity_days: "30",
                    role_id: "",
                });
            }
        }
    }, [open, kpiToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const url = kpiToEdit
                ? `/api/kpis/${kpiToEdit.id}`
                : "/api/kpis";
            const method = kpiToEdit ? "PUT" : "POST";

            const payload = {
                indicator_name: formData.indicator_name,
                target_value: formData.target_value ? parseFloat(formData.target_value) : null,
                periodicity_days: parseInt(formData.periodicity_days),
                role_id: parseInt(formData.role_id),
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Error al guardar KPI");
            }

            toast.success(
                kpiToEdit
                    ? "KPI actualizado exitosamente"
                    : "KPI creado exitosamente"
            );
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("Ocurrió un error al guardar el KPI");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>
                        {kpiToEdit ? "Editar KPI" : "Nuevo KPI"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <Label htmlFor="indicator_name">Nombre del Indicador *</Label>
                            <Input
                                id="indicator_name"
                                value={formData.indicator_name}
                                onChange={(e) =>
                                    setFormData({ ...formData, indicator_name: e.target.value })
                                }
                                placeholder="Ej: Satisfacción del Cliente"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="target_value">Valor Objetivo (Meta)</Label>
                            <Input
                                id="target_value"
                                type="number"
                                step="0.01"
                                value={formData.target_value}
                                onChange={(e) =>
                                    setFormData({ ...formData, target_value: e.target.value })
                                }
                                placeholder="Ej: 90"
                            />
                        </div>

                        <div>
                            <Label htmlFor="periodicity_days">Periodicidad (Días) *</Label>
                            <Input
                                id="periodicity_days"
                                type="number"
                                min="1"
                                value={formData.periodicity_days}
                                onChange={(e) =>
                                    setFormData({ ...formData, periodicity_days: e.target.value })
                                }
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <Label htmlFor="role_id">Rol Responsable *</Label>
                            <RichSelect
                                options={roles}
                                value={formData.role_id}
                                onValueChange={(val) => setFormData({ ...formData, role_id: val })}
                                placeholder="Seleccionar rol"
                                showAvatar={false}
                            />
                        </div>
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
                            {isSubmitting ? "Guardando..." : "Guardar KPI"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
