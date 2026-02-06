'use client';

import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichSelect } from "@/components/ui/rich-select";
import { toast } from "sonner";
import { Briefcase } from "lucide-react";
import ModelAttachments, { ModelAttachmentsRef } from "@/components/cloud/ModelAttachments";
import { DateService } from "@/lib/date-service";

interface CaseFormModalProps {
    open: boolean;
    onClose: () => void;
    caseData?: any | null; // If null, it's create mode
    typeOptions: any[];
    statusOptions: any[];
    responsibleOptions: any[];
    projectOptions: any[];
}

export default function CaseFormModal({ open, onClose, caseData, typeOptions, statusOptions, responsibleOptions, projectOptions }: CaseFormModalProps) {
    const isEdit = !!caseData;
    const queryClient = useQueryClient();
    const attachmentsRef = useRef<ModelAttachmentsRef>(null);
    const [currentCaseData, setCurrentCaseData] = useState(caseData);

    const [formData, setFormData] = useState({
        subject: "",
        date: "",
        type_id: "",
        status_id: "",
        mediums: "",
        project_id: "",
        responsible_id: "",
        description: "",
        files: [] as File[],
        pending_file_ids: [] as number[],
    });

    // Fetch full case data when modal opens in edit mode
    useEffect(() => {
        const fetchFullCaseData = async () => {
            if (caseData && isEdit && caseData.id && open) {
                try {
                    const res = await fetch(`/api/marketing/cases/${caseData.id}`);
                    if (res.ok) {
                        const fullData = await res.json();
                        setCurrentCaseData(fullData);
                    }
                } catch (error) {
                    console.error("Error fetching full case data:", error);
                    setCurrentCaseData(caseData);
                }
            } else {
                setCurrentCaseData(caseData);
            }
        };

        fetchFullCaseData();
    }, [caseData, isEdit, open]);

    // Update form data when currentCaseData changes
    useEffect(() => {
        if (currentCaseData && isEdit) {
            setFormData({
                subject: currentCaseData.subject || "",
                date: DateService.toInput(currentCaseData.date),
                type_id: currentCaseData.typeId ? currentCaseData.typeId.toString() : "",
                status_id: currentCaseData.statusId ? currentCaseData.statusId.toString() : "",
                mediums: currentCaseData.mediums || "",
                project_id: currentCaseData.projectId ? currentCaseData.projectId.toString() : "",
                responsible_id: currentCaseData.responsibleId ? currentCaseData.responsibleId.toString() : "",
                description: currentCaseData.description || "",
                files: [],
                pending_file_ids: [],
            });
        } else if (!isEdit) {
            setFormData({
                subject: "",
                date: DateService.todayInput(),
                type_id: "",
                status_id: "",
                mediums: "",
                project_id: "",
                responsible_id: "",
                description: "",
                files: [],
                pending_file_ids: [],
            });
        }
    }, [currentCaseData, isEdit]);

    const refreshCaseData = async () => {
        if (isEdit && currentCaseData?.id) {
            try {
                const res = await fetch(`/api/marketing/cases/${currentCaseData.id}`);
                if (res.ok) {
                    const freshData = await res.json();
                    setCurrentCaseData(freshData);
                }
            } catch (error) {
                console.error("Error refreshing case data:", error);
            }
        }
    };

    const mutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const url = isEdit ? `/api/marketing/cases/${caseData.id}` : "/api/marketing/cases";
            const method = isEdit ? "PUT" : "POST";

            const allFileIds = await attachmentsRef.current?.upload() || [];

            const payload = {
                ...data,
                pending_file_ids: allFileIds
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Error saving case");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["marketing-cases"] });
            toast.success(isEdit ? "Caso actualizado" : "Caso creado");
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.message);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-yellow-100 p-2 rounded-full text-yellow-600">
                            <Briefcase className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle>{isEdit ? "Editar Caso" : "Nuevo Caso"}</DialogTitle>
                            <DialogDescription>
                                {isEdit ? "Actualiza la información del caso" : "Complete los datos para registrar un nuevo caso"}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Subject */}
                        <div className="lg:col-span-2 space-y-2">
                            <Label htmlFor="subject">Asunto *</Label>
                            <Input
                                id="subject"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                placeholder="Resumen del requerimiento o caso"
                                required
                            />
                        </div>

                        {/* Date */}
                        <div className="space-y-2">
                            <Label htmlFor="date">Fecha *</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Classification */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="type_id">Tipo de Caso</Label>
                            <Select value={formData.type_id} onValueChange={(val) => setFormData({ ...formData, type_id: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {typeOptions.map((option) => (
                                        <SelectItem key={option.id} value={option.id.toString()}>{option.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status_id">Estado</Label>
                            <Select value={formData.status_id} onValueChange={(val) => setFormData({ ...formData, status_id: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((option) => (
                                        <SelectItem key={option.id} value={option.id.toString()}>{option.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="mediums">Medios / Canales</Label>
                            <Input
                                id="mediums"
                                value={formData.mediums}
                                onChange={(e) => setFormData({ ...formData, mediums: e.target.value })}
                                placeholder="Ej: Web, Email, Reunión"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="project_id">Proyecto</Label>
                            <Select value={formData.project_id} onValueChange={(val) => setFormData({ ...formData, project_id: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sin Proyecto" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projectOptions.map((project) => (
                                        <SelectItem key={project.id} value={project.id.toString()}>{project.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="responsible">Responsable</Label>
                            <RichSelect
                                options={responsibleOptions}
                                value={formData.responsible_id}
                                onValueChange={(val) => setFormData({ ...formData, responsible_id: val })}
                                placeholder="Seleccionar"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Detalles del caso..."
                            rows={4}
                        />
                    </div>

                    {/* Files */}
                    <div className="border-t pt-4">
                        <Label className="block mb-3">Archivos Adjuntos</Label>
                        <ModelAttachments
                            ref={attachmentsRef}
                            areaSlug="marketing"
                            modelId={currentCaseData?.id}
                            modelType="App\Models\CaseMarketing"
                            initialFiles={currentCaseData?.files || []}
                            onUpdate={refreshCaseData}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? (isEdit ? "Actualizando..." : "Guardando...") : (isEdit ? "Actualizar" : "Guardar")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
