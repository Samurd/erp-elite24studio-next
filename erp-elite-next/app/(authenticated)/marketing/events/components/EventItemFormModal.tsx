import React, { useEffect, useState, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ModelAttachments, { ModelAttachmentsRef } from "@/components/cloud/ModelAttachments";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import MoneyInput from "@/components/ui/money-input";
import { RichSelect } from "@/components/ui/rich-select";

interface Option {
    id: number;
    name: string;
}

interface FileModel {
    id: number;
    name: string;
    size: number | null;
    url: string;
}

interface EventItemFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    eventId: number;
    itemToEdit?: any;
    onSuccess: () => void;
    unitOptions: Option[];
    eventName?: string;
}

export function EventItemFormModal({
    open,
    onOpenChange,
    eventId,
    itemToEdit,
    onSuccess,
    unitOptions,
    eventName,
}: EventItemFormModalProps) {
    const [loading, setLoading] = useState(false);
    const attachmentsRef = useRef<ModelAttachmentsRef>(null);
    const [formData, setFormData] = useState({
        description: "",
        quantity: "",
        unit_id: "",
        unit_price: 0,
        total_price: 0,
    });

    const [files, setFiles] = useState<File[]>([]);
    const [pendingCloudFiles, setPendingCloudFiles] = useState<FileModel[]>([]);

    useEffect(() => {
        if (itemToEdit) {
            setFormData({
                description: itemToEdit.description || "",
                quantity: itemToEdit.quantity.toString() || "",
                unit_id: itemToEdit.unitId || itemToEdit.unit?.id || "",
                unit_price: itemToEdit.unitPrice || 0,
                total_price: itemToEdit.totalPrice || 0,
            });
            setFiles([]);
            setPendingCloudFiles([]);
        } else {
            setFormData({
                description: "",
                quantity: "",
                unit_id: "",
                unit_price: 0,
                total_price: 0,
            });
            setFiles([]);
            setPendingCloudFiles([]);
        }
    }, [itemToEdit, open]);

    const calculateTotal = (qty: string, price: number) => {
        const q = parseFloat(qty) || 0;
        return q * price;
    };

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const qty = e.target.value;
        const total = calculateTotal(qty, formData.unit_price);
        setFormData({ ...formData, quantity: qty, total_price: total });
    };

    const handlePriceChange = (value: number) => {
        const total = calculateTotal(formData.quantity, value);
        setFormData({ ...formData, unit_price: value, total_price: total });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = itemToEdit
                ? `/api/marketing/events/${eventId}/items/${itemToEdit.id}`
                : `/api/marketing/events/${eventId}/items`;
            const method = itemToEdit ? "PUT" : "POST";

            const allFileIds = await attachmentsRef.current?.upload() || [];

            const payload = {
                ...formData,
                pending_file_ids: allFileIds
            };

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error("Error saving item");

            toast.success(`Ítem ${itemToEdit ? "actualizado" : "agregado"} correctamente`);
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("No se pudo guardar el ítem");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>
                        {itemToEdit ? "Editar Ítem" : "Nuevo Ítem"}
                    </DialogTitle>
                    {eventName && (
                        <p className="text-sm text-gray-500">Evento: <span className="font-semibold">{eventName}</span></p>
                    )}
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1 md:col-span-2">
                            <Label htmlFor="description">Descripción del Ítem *</Label>
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                placeholder="Ej: Alquiler de sonido..."
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="quantity">Cantidad *</Label>
                            <Input
                                type="number"
                                id="quantity"
                                value={formData.quantity}
                                onChange={handleQuantityChange}
                                step="0.01"
                                min="0"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="unit_id">Unidad de Medida *</Label>
                            <RichSelect
                                options={unitOptions}
                                value={formData.unit_id}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, unit_id: value })
                                }
                                placeholder="Seleccionar unidad"
                                showAvatar={false}
                            />
                        </div>

                        <div>
                            <Label>Valor Unitario *</Label>
                            <MoneyInput
                                value={formData.unit_price}
                                onChange={handlePriceChange}
                                placeholder="$0.00"
                            />
                        </div>

                        <div>
                            <Label>Valor Total</Label>
                            <MoneyInput
                                value={formData.total_price}
                                onChange={(val) => setFormData({ ...formData, total_price: val })}
                                placeholder="$0.00"
                            // Typically read-only but editable in legacy
                            />
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <Label className="block mb-2">Archivos Adjuntos (Cotizaciones, Facturas, etc.)</Label>
                        <ModelAttachments
                            ref={attachmentsRef}
                            areaSlug="marketing"
                            modelId={itemToEdit?.id}
                            modelType="App\Models\EventItem"
                            initialFiles={itemToEdit?.files || []}
                        />
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-yellow-600 hover:bg-yellow-700">
                            {loading ? "Guardando..." : "Guardar Ítem"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
