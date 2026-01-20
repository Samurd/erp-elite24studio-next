
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RichSelect } from "@/components/ui/rich-select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const formSchema = z.object({
    recipient_name: z.string().min(1, "El nombre del destinatario es requerido"),
    recipient_role: z.string().min(1, "El cargo es requerido"),
    position_area: z.string().min(1, "El área/posición es requerida"),
    kit_type: z.string().optional(),
    kit_contents: z.string().optional(),
    request_date: z.string().min(1, "La fecha de solicitud es requerida"),
    delivery_date: z.string().optional(),
    delivery_responsible_user_id: z.string().optional(),
    status_id: z.string().optional(),
    observations: z.string().optional(),
});

interface KitFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: any;
    users: any[];
    statusOptions: any[];
}

export function KitForm({
    open,
    onOpenChange,
    initialData,
    users,
    statusOptions
}: KitFormProps) {
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            recipient_name: "",
            recipient_role: "",
            position_area: "",
            kit_type: "",
            kit_contents: "",
            request_date: new Date().toISOString().split('T')[0],
            delivery_date: "",
            delivery_responsible_user_id: "",
            status_id: "",
            observations: "",
        },
    });

    useEffect(() => {
        if (initialData) {
            form.reset({
                recipient_name: initialData.recipientName || "",
                recipient_role: initialData.recipientRole || "",
                position_area: initialData.positionArea || "",
                kit_type: initialData.kitType || "",
                kit_contents: initialData.kitContents || "",
                request_date: initialData.requestDate?.split('T')[0] || "",
                delivery_date: initialData.deliveryDate?.split('T')[0] || "",
                delivery_responsible_user_id: initialData.deliveryResponsibleUser?.id?.toString() || initialData.deliveryResponsibleUserId?.toString() || "",
                status_id: initialData.status?.id?.toString() || initialData.statusId?.toString() || "",
                observations: initialData.observations || "",
            });
        } else {
            form.reset({
                recipient_name: "",
                recipient_role: "",
                position_area: "",
                kit_type: "",
                kit_contents: "",
                request_date: new Date().toISOString().split('T')[0],
                delivery_date: "",
                delivery_responsible_user_id: "",
                status_id: "",
                observations: "",
            });
        }
    }, [initialData, form, open]);

    const mutation = useMutation({
        mutationFn: async (values: z.infer<typeof formSchema>) => {
            const url = initialData ? `/api/rrhh/kits/${initialData.id}` : "/api/rrhh/kits";
            const method = initialData ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                throw new Error("Failed to save kit");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["kits"] });
            toast.success(initialData ? "Kit actualizado" : "Kit creado");
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error("Error al guardar el kit");
            console.error(error);
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        mutation.mutate(values);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Editar Kit" : "Nuevo Kit"}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        {/* Recipient Info */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Información del Destinatario</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="recipient_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre del Destinatario <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="recipient_role"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cargo <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="position_area"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Área / Posición <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Kit Details */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Detalles del Kit</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="kit_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tipo de Kit</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Ej. Kit de Bienvenida" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="kit_contents"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Contenido</FormLabel>
                                            <FormControl>
                                                <Textarea {...field} rows={2} placeholder="Detalle de elementos..." />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Process Info */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Información del Proceso</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="request_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fecha de Solicitud <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="delivery_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fecha de Entrega</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="delivery_responsible_user_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Responsable de Entrega</FormLabel>
                                            <FormControl>
                                                <RichSelect
                                                    options={users}
                                                    value={field.value || undefined}
                                                    onValueChange={field.onChange}
                                                    placeholder="Seleccionar responsable"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

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
                                                    {statusOptions.map((opt) => (
                                                        <SelectItem key={opt.id} value={opt.id.toString()}>
                                                            {opt.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="observations"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Observaciones</FormLabel>
                                            <FormControl>
                                                <Textarea {...field} rows={3} placeholder="Notas adicionales..." />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700" disabled={mutation.isPending}>
                                {mutation.isPending ? "Guardando..." : (initialData ? "Actualizar" : "Guardar")}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
