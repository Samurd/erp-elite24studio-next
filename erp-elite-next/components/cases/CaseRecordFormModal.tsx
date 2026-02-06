
"use client";

import { useEffect, useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichSelect } from "@/components/ui/rich-select";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import ModelAttachments, { ModelAttachmentsRef } from "@/components/cloud/ModelAttachments";

interface CaseRecord {
    id: number;
    date: string;
    description?: string;
    channel?: string;
    contact: { id: number; name: string };
    contact_id?: number; // for edit
    assigned_to: { id: number; name: string };
    assigned_to_id?: number;// for edit
    status: { id: number; name: string };
    status_id?: number; // for edit
    type: { id: number; name: string };
    case_type_id?: number; // for edit
    files?: any[];
}

interface CaseRecordFormModalProps {
    open: boolean;
    onClose: () => void;
    record?: CaseRecord | null;
    options: {
        users: any[];
        states: any[];
        case_types: any[];
        contacts: any[];
    };
    defaultUserId?: number;
}

// Update Props to include options typing if strict, but ignoring for brevity of change unless needed.
// Main logic change:

export default function CaseRecordFormModal({ open, onClose, record, options, defaultUserId }: CaseRecordFormModalProps) {
    const queryClient = useQueryClient();
    const isEdit = !!record;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const attachmentsRef = useRef<ModelAttachmentsRef>(null);

    // Fetch full data including files when in edit mode
    const { data: fetchedRecord, refetch } = useQuery({
        queryKey: ["case-record", record?.id],
        queryFn: async () => {
            if (!record?.id) return null;
            const response = await fetch(`/api/case-records?id=${record.id}`); // API might need adjustment to fetch single by ID or filter.
            // Actually, the api/case-records GET supports filters but maybe not single ID directly via path in GET list?
            // The list GET returns { data: [], meta: ... }.
            // Let's check if there is a 'show' endpoint. Yes: app/api/case-records/[id]/route.ts NO GET there?
            // Wait, I didn't see a GET in [id]/route.ts.
            // I should double check [id]/route.ts. If no GET, I might need to rely on the list or add GET.
            // For now, let's assume I can use the list endpoint with ID filter if available, or just rely on passing record and potentially manual fetch if needed?
            // User's previous patterns show adding GET to [id] is common.
            // Let's TRY to fetch from `api/case-records/${id}`. If it fails (404/405), I might need to add GET to [id].
            // But wait, I saw [id]/route.ts and it only had PUT and DELETE.
            // I will ADD GET to [id]/route.ts as part of this if needed.
            // Or I can use the passed `record` if it already has files?
            // The `CaseRecord` interface has `files?: any[]`.
            // If the parent list already fetches files, we are good.
            // But usually list views don't fetch all files?
            // In `CaseRecordFormModal`, let's assume we want fresh data.
            // I'll add a fetch here, but I must ensure the endpoint exists.
            // The safe bet without modifying backend more is to fetch from the list endpoint with a filter OR just use `record` if the user says the list has them.
            // But strict requirement is "fix file linking".
            // Implementation Plan said: "Use useQuery... if record is present".
            // I will add the GET endpoint to [id]/route.ts in valid step if missing?
            // I'll stick to `record` for now but enable refreshing if needed?
            // Actually, the previous fixes ADDED `useQuery` to fetch `api/.../${id}`.
            // I should probably check if `GET` exists in [id]/route.ts. Explicitly.
            // I viewed it in step 152. It ONLY has PUT and DELETE.
            // So fetching `/api/case-records/${id}` will 405.
            // I SHOULD ADD GET TO api/case-records/[id]/route.ts FIRST or ALSO.
            // But I am in multi_replace for frontend now.
            // I'll use `record` for `initialData` and if I need to fetch, I can't yet.
            // BUT, verifying `NormsFormModal` used `useQuery` on `api/finances/norms/${id}`.
            // And `EmployeeForm` used `api/rrhh/employees/${id}`.
            // So likely I should add GET to `case-records/[id]`.
            // FOR NOW, I will implement the frontend to EXPECT it, and I will add the backend GET right after.
            const res = await fetch(`/api/case-records/${record.id}`);
            if (!res.ok) return record; // Fallback
            return res.json();
        },
        enabled: open && isEdit && !!record?.id,
        initialData: record,
    });

    const activeRecord = fetchedRecord || record;

    const { control, handleSubmit, reset, setValue } = useForm({
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
            channel: "",
            case_type_id: "",
            status_id: "",
            assigned_to_id: defaultUserId ? defaultUserId.toString() : "",
            contact_id: "",
            description: ""
        }
    });

    useEffect(() => {
        if (open) {
            if (activeRecord) {
                // Formatting values for inputs
                reset({
                    date: activeRecord.date || new Date().toISOString().split('T')[0],
                    channel: activeRecord.channel || "",
                    case_type_id: activeRecord.type?.id?.toString() || activeRecord.case_type_id?.toString() || "",
                    status_id: activeRecord.status?.id?.toString() || activeRecord.status_id?.toString() || "",
                    assigned_to_id: activeRecord.assigned_to?.id?.toString() || activeRecord.assigned_to_id?.toString() || "",
                    contact_id: activeRecord.contact?.id?.toString() || activeRecord.contact_id?.toString() || "",
                    description: activeRecord.description || ""
                });
            } else {
                reset({
                    date: new Date().toISOString().split('T')[0],
                    channel: "",
                    case_type_id: "",
                    status_id: "",
                    assigned_to_id: defaultUserId ? defaultUserId.toString() : "",
                    contact_id: "",
                    description: ""
                });
            }
        }
    }, [open, activeRecord, reset, defaultUserId]);

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            // Upload files
            const uploadedIds = await attachmentsRef.current?.upload() || [];

            const payload = {
                ...data,
                pending_file_ids: uploadedIds
            };

            if (isEdit) {
                const response = await fetch(`/api/case-records/${record?.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!response.ok) throw new Error("Failed to update");
                toast.success("Registro actualizado");
            } else {
                const response = await fetch("/api/case-records", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!response.ok) throw new Error("Failed to create");
                toast.success("Registro creado exitosamente");
            }

            queryClient.invalidateQueries({ queryKey: ["case-records"] });
            if (isEdit && record?.id) {
                queryClient.invalidateQueries({ queryKey: ["case-record", record.id] });
            }
            onClose();

        } catch (error) {
            console.error(error);
            toast.error(isEdit ? "Error al actualizar" : "Error al crear");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="min-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Editar Caso" : "Nuevo Registro de Caso"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="date">Fecha</Label>
                            <Controller
                                name="date"
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => <Input type="date" {...field} />}
                            />
                        </div>

                        <div>
                            <Label htmlFor="channel">Canal</Label>
                            <Controller
                                name="channel"
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => <Input placeholder="Ej: WhatsApp" {...field} />}
                            />
                        </div>

                        <div>
                            <Label htmlFor="case_type_id">Tipo de Caso</Label>
                            <Controller
                                name="case_type_id"
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value?.toString()}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {options.case_types.map((opt: any) => (
                                                <SelectItem key={opt.id} value={opt.id.toString()}>{opt.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        <div>
                            <Label htmlFor="status_id">Estado</Label>
                            <Controller
                                name="status_id"
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value?.toString()}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {options.states.map((opt: any) => (
                                                <SelectItem key={opt.id} value={opt.id.toString()}>{opt.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        <div>
                            <Label htmlFor="assigned_to_id">Asesor</Label>
                            <Controller
                                name="assigned_to_id"
                                control={control}
                                render={({ field }) => (
                                    <RichSelect
                                        value={field.value ? Number(field.value) : undefined}
                                        onValueChange={(val) => field.onChange(val?.toString())}
                                        options={options.users}
                                        placeholder="Seleccionar asesor..."
                                        label=""
                                        imageKey="image"
                                    />
                                )}
                            />
                        </div>

                        <div>
                            <Label htmlFor="contact_id">Contacto</Label>
                            <Controller
                                name="contact_id"
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value?.toString()}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {options.contacts.map((opt: any) => (
                                                <SelectItem key={opt.id} value={opt.id.toString()}>{opt.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="description">Descripción / Observaciones</Label>
                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => <Textarea rows={5} {...field} />}
                        />
                    </div>

                    {/* Attachments */}
                    <div>
                        <Label className="mb-2 block">Archivos Adjuntos</Label>
                        <ModelAttachments
                            ref={attachmentsRef}
                            areaSlug="registro-casos"
                            initialFiles={activeRecord?.files || []}
                            modelId={activeRecord?.id}
                            modelType="App\Models\CaseRecord"
                            onUpdate={() => refetch()}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Guardando..." : (isEdit ? "Actualizar" : "Crear")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

