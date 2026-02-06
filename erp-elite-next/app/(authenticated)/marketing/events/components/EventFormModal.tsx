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
import { Textarea } from "@/components/ui/textarea";
import ModelAttachments, { ModelAttachmentsRef } from "@/components/cloud/ModelAttachments";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RichSelect } from "@/components/ui/rich-select";
import { DateService } from "@/lib/date-service";

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

interface EventFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    eventToEdit?: any;
    onSuccess: () => void;
    typeOptions: Option[];
    statusOptions: Option[];
    responsibleOptions: any[];
}

export function EventFormModal({
    open,
    onOpenChange,
    eventToEdit,
    onSuccess,
    typeOptions,
    statusOptions,
    responsibleOptions,
}: EventFormModalProps) {
    const [loading, setLoading] = useState(false);
    const attachmentsRef = useRef<ModelAttachmentsRef>(null);
    const [currentEventData, setCurrentEventData] = useState(eventToEdit);
    const [formData, setFormData] = useState({
        name: "",
        type_id: "",
        event_date: "",
        location: "",
        status_id: "",
        responsible_id: "",
        observations: "",
    });

    const [files, setFiles] = useState<File[]>([]);
    const [pendingCloudFiles, setPendingCloudFiles] = useState<FileModel[]>([]);

    // Fetch full event data when modal opens in edit mode
    useEffect(() => {
        const fetchFullEventData = async () => {
            if (eventToEdit && eventToEdit.id && open) {
                try {
                    const res = await fetch(`/api/marketing/events/${eventToEdit.id}`);
                    if (res.ok) {
                        const fullData = await res.json();
                        setCurrentEventData(fullData);
                    }
                } catch (error) {
                    console.error("Error fetching full event data:", error);
                    setCurrentEventData(eventToEdit);
                }
            } else {
                setCurrentEventData(eventToEdit);
            }
        };

        fetchFullEventData();
    }, [eventToEdit, open]);

    // Update form data when currentEventData changes
    useEffect(() => {
        if (currentEventData) {
            setFormData({
                name: currentEventData.name || "",
                type_id: currentEventData.type?.id.toString() || currentEventData.typeId?.toString() || "",
                event_date: DateService.toInput(currentEventData.eventDate),
                location: currentEventData.location || "",
                status_id: currentEventData.status?.id.toString() || currentEventData.statusId?.toString() || "",
                responsible_id: currentEventData.responsible?.id || currentEventData.responsibleId || "",
                observations: currentEventData.observations || "",
            });
            setFiles([]);
            setPendingCloudFiles([]);
        } else {
            setFormData({
                name: "",
                type_id: "",
                event_date: DateService.todayInput(),
                location: "",
                status_id: "",
                responsible_id: "",
                observations: "",
            });
            setFiles([]);
            setPendingCloudFiles([]);
        }
    }, [currentEventData]);

    const refreshEventData = async () => {
        if (currentEventData?.id) {
            try {
                const res = await fetch(`/api/marketing/events/${currentEventData.id}`);
                if (res.ok) {
                    const freshData = await res.json();
                    setCurrentEventData(freshData);
                }
            } catch (error) {
                console.error("Error refreshing event data:", error);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = eventToEdit
                ? `/api/marketing/events/${eventToEdit.id}`
                : "/api/marketing/events";
            const method = eventToEdit ? "PUT" : "POST";

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

            if (!response.ok) throw new Error("Error saving event");

            const data = await response.json();

            toast.success(`Evento ${eventToEdit ? "actualizado" : "creado"} correctamente`);
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("No se pudo guardar el evento");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {eventToEdit ? "Editar Evento" : "Nuevo Evento"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <Label htmlFor="name">Nombre del Evento *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="event_date">Fecha del Evento *</Label>
                            <Input
                                type="date"
                                id="event_date"
                                value={formData.event_date}
                                onChange={(e) =>
                                    setFormData({ ...formData, event_date: e.target.value })
                                }
                                required
                            />
                        </div>

                        <div className="lg:col-span-1">
                            <Label htmlFor="location">Lugar / Ubicación *</Label>
                            <Input
                                id="location"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="Ej: Salon de conferencias, Hotel..."
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <Label htmlFor="type_id">Tipo de Evento *</Label>
                            <Select
                                value={formData.type_id}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, type_id: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {typeOptions.map((type) => (
                                        <SelectItem key={type.id} value={type.id.toString()}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="status_id">Estado *</Label>
                            <Select
                                value={formData.status_id}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, status_id: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((status) => (
                                        <SelectItem key={status.id} value={status.id.toString()}>
                                            {status.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="responsible_id">Responsable *</Label>
                            <RichSelect
                                options={responsibleOptions}
                                value={formData.responsible_id}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, responsible_id: value })
                                }
                                placeholder="Seleccionar responsable"
                                imageKey="profile_photo_url"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="observations">Observaciones</Label>
                        <Textarea
                            id="observations"
                            value={formData.observations}
                            onChange={(e) =>
                                setFormData({ ...formData, observations: e.target.value })
                            }
                            rows={4}
                        />
                    </div>

                    <div className="border-t pt-4">
                        <Label className="block mb-2">Archivos Adjuntos</Label>
                        <ModelAttachments
                            ref={attachmentsRef}
                            areaSlug="marketing"
                            modelId={currentEventData?.id}
                            modelType="App\Models\Event"
                            initialFiles={currentEventData?.files || []}
                            onUpdate={refreshEventData}
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
                            {loading ? "Guardando..." : "Guardar Evento"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
