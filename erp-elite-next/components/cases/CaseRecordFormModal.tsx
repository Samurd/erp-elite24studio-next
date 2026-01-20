
"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichSelect } from "@/components/ui/rich-select";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import ModelAttachmentsCreator from "@/components/cloud/ModelAttachmentsCreator";
import ModelAttachments from "@/components/cloud/ModelAttachments";

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

export default function CaseRecordFormModal({ open, onClose, record, options, defaultUserId }: CaseRecordFormModalProps) {
    const queryClient = useQueryClient();
    const isEdit = !!record;

    const [files, setFiles] = useState<File[]>([]);
    const [pendingCloudFiles, setPendingCloudFiles] = useState<any[]>([]);

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
            if (record) {
                // Formatting values for inputs
                reset({
                    date: record.date || new Date().toISOString().split('T')[0],
                    channel: record.channel || "",
                    case_type_id: record.type?.id?.toString() || record.case_type_id?.toString() || "",
                    status_id: record.status?.id?.toString() || record.status_id?.toString() || "",
                    assigned_to_id: record.assigned_to?.id?.toString() || record.assigned_to_id?.toString() || "",
                    contact_id: record.contact?.id?.toString() || record.contact_id?.toString() || "",
                    description: record.description || ""
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
            setFiles([]);
            setPendingCloudFiles([]);
        }
    }, [open, record, reset, defaultUserId]);

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            // Include file uploads logic here if 'files' state has items
            // But 'ModelAttachmentsCreator' puts new files into 'files' state
            // AND the logic to upload them needs to happen. 
            // The Server Action `uploadFile` is used by the components, but here 
            // for creation we usually upload first then send IDs. 

            // However, the `ModelAttachmentsCreator` component is designed to EMIT the file objects.
            // We need to upload them here manually before submitting the form?
            // The Laravel implementation submitted everything as FormData.
            // But my creating `route.ts` expects JSON + `pending_file_ids`. 

            // Let's implement the upload flow:
            // 1. Upload `files` using `uploadFile` action.
            // 2. Collect IDs.
            // 3. Combine with `pendingCloudFiles` IDs.
            // 4. Send to API.

            const uploadedFileIds = [];
            const { uploadFile } = await import("@/actions/files"); // Dynamic import to use server action on client? 
            // Actually server actions can be imported securely.

            if (files.length > 0) {
                for (const file of files) {
                    const formData = new FormData();
                    formData.append('file', file);
                    const res = await uploadFile(formData);
                    if (res.success && res.file) {
                        uploadedFileIds.push(res.file.id);
                    }
                }
            }

            const pendingIds = pendingCloudFiles.map(f => f.id);
            const allFileIds = [...uploadedFileIds, ...pendingIds];

            const response = await fetch("/api/case-records", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, pending_file_ids: allFileIds }),
            });

            if (!response.ok) throw new Error("Failed to create");
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["case-records"] });
            toast.success("Registro creado exitosamente");
            onClose();
        },
        onError: () => toast.error("Error al crear registro")
    });

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await fetch(`/api/case-records/${record?.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error("Failed to update");
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["case-records"] });
            toast.success("Registro actualizado");
            onClose();
        },
        onError: () => toast.error("Error al actualizar")
    });

    const onSubmit = (data: any) => {
        if (isEdit) {
            updateMutation.mutate(data);
        } else {
            createMutation.mutate(data);
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
                        {isEdit ? (
                            record && (
                                <ModelAttachments
                                    initialFiles={record.files || []}
                                    modelId={record.id}
                                    modelType="App\Models\CaseRecord"
                                    onUpdate={() => queryClient.invalidateQueries({ queryKey: ["case-records"] })}
                                />
                            )
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
                        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                            {createMutation.isPending || updateMutation.isPending ? "Guardando..." : (isEdit ? "Actualizar" : "Crear")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

