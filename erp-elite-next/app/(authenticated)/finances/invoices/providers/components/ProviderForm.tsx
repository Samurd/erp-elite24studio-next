
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RichSelect } from "@/components/ui/rich-select";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MoneyInput from "@/components/ui/money-input";
import ModelAttachmentsCreator from "@/components/cloud/ModelAttachmentsCreator";
import ModelAttachments from "@/components/cloud/ModelAttachments";
import Link from "next/link";
import { DateService } from "@/lib/date-service";
import { useState } from "react";

const formSchema = z.object({
    invoice_date: z.string().min(1, "La fecha es requerida"),
    code: z.string().optional(),
    contact_id: z.string().min(1, "El proveedor es requerido"),
    description: z.string().optional(),
    total_amount: z.number().min(0, "El monto es requerido"),
    method_payment: z.string().optional(),
    status_id: z.string().optional(),
    pending_file_ids: z.array(z.number()).optional(),
    files: z.array(z.any()).optional(),
});

type ProviderFormProps = {
    invoice?: any;
    isEditing?: boolean;
    onSuccess?: () => void;
    onCancel?: () => void;
    hideTitle?: boolean;
};

export default function ProviderForm({ invoice, isEditing = false, onSuccess, onCancel, hideTitle = false }: ProviderFormProps) {

    const router = useRouter();
    const queryClient = useQueryClient();

    const [pendingCloudFiles, setPendingCloudFiles] = useState<any[]>([]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            invoice_date: invoice?.invoiceDate ? DateService.toInput(invoice.invoiceDate) : DateService.todayInput(),
            code: invoice?.code || "",
            contact_id: invoice?.contactId?.toString() || "",
            description: invoice?.description || "",
            total_amount: invoice?.total ? Number(invoice.total) : 0,
            method_payment: invoice?.methodPayment || "",
            status_id: invoice?.statusId?.toString() || "",
            pending_file_ids: [],
            files: [],
        },
    });

    // Fetch Options
    const { data: options } = useQuery({
        queryKey: ["invoices-providers-options"],
        queryFn: async () => {
            const res = await fetch("/api/finances/invoices/providers/options");
            if (!res.ok) throw new Error("Failed to fetch options");
            return res.json();
        },
    });

    // Create Mutation
    const createMutation = useMutation({
        mutationFn: async (values: z.infer<typeof formSchema>) => {
            const res = await fetch("/api/finances/invoices/providers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Error al crear factura");
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success("Factura creada exitosamente");
            if (onSuccess) {
                onSuccess();
            } else {
                router.push("/finances/invoices/providers");
                router.refresh();
            }
        },
        onError: (error: Error) => {
            toast.error("Error", { description: error.message });
        },
    });

    // Update Mutation
    const updateMutation = useMutation({
        mutationFn: async (values: z.infer<typeof formSchema>) => {
            const res = await fetch(`/api/finances/invoices/providers/${invoice.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            if (!res.ok) throw new Error("Error al actualizar factura");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Factura actualizada exitosamente");
            queryClient.invalidateQueries({ queryKey: ["invoices-providers"] });
            queryClient.invalidateQueries({ queryKey: ["invoice-provider", invoice.id] });
            if (onSuccess) {
                onSuccess();
            } else {
                router.push("/finances/invoices/providers");
            }
        },
        onError: (error: Error) => {
            toast.error("Error", { description: error.message });
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        if (isEditing) {
            updateMutation.mutate(values);
        } else {
            createMutation.mutate(values);
        }
    }

    return (
        <div className="bg-white rounded-lg shadow-sm p-6 max-w-4xl mx-auto">
            {!hideTitle && (
                <div className="flex justify-between items-center border-b pb-4 mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {isEditing ? "Editar Factura Proveedor" : "Crear Factura Proveedor"}
                    </h2>
                </div>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="invoice_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha de Factura <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Código</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            readOnly
                                            className="bg-gray-50 font-mono text-gray-500"
                                            placeholder={isEditing ? "" : "(Autogenerado al guardar)"}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="contact_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Proveedor <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <RichSelect
                                        options={options?.providerContacts?.map((c: any) => ({ ...c, id: c.id.toString() })) || []}
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        placeholder="Seleccionar proveedor..."
                                        showAvatar={false}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Descripción</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Descripción de la factura..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="total_amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Monto Total <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <MoneyInput
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder="$0.00"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="method_payment"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Método de Pago</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Transferencia, Efectivo..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="status_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Estado</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar estado" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {options?.statusOptions?.map((status: any) => (
                                            <SelectItem key={status.id} value={status.id.toString()}>
                                                {status.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold mb-4">Archivos Adjuntos</h3>

                        {isEditing && invoice ? (
                            <ModelAttachments
                                initialFiles={invoice.files || []}
                                modelId={invoice.id}
                                modelType="App\Models\Invoice"
                                onUpdate={() => {
                                    queryClient.invalidateQueries({ queryKey: ["invoice-provider", invoice.id] });
                                    queryClient.invalidateQueries({ queryKey: ["invoices-providers"] });
                                }}
                            />
                        ) : (
                            <FormField
                                control={form.control}
                                name="files"
                                render={({ field }) => (
                                    <ModelAttachmentsCreator
                                        files={field.value || []}
                                        onFilesChange={field.onChange}
                                        pendingCloudFiles={pendingCloudFiles}
                                        onPendingCloudFilesChange={(files: any[]) => {
                                            setPendingCloudFiles(files);
                                            form.setValue("pending_file_ids", files.map((f: any) => f.id));
                                        }}
                                    />
                                )}
                            />
                        )}
                    </div>

                    <div className="flex justify-end gap-3 border-t pt-6">
                        {onCancel ? (
                            <Button variant="outline" type="button" onClick={onCancel}>Cancelar</Button>
                        ) : (
                            <Link href="/finances/invoices/providers">
                                <Button variant="outline" type="button">Cancelar</Button>
                            </Link>
                        )}
                        <Button
                            type="submit"
                            className="bg-yellow-600 hover:bg-yellow-700 text-white"
                            disabled={createMutation.isPending || updateMutation.isPending}
                        >
                            {createMutation.isPending || updateMutation.isPending ? "Guardando..." : (isEditing ? "Actualizar" : "Crear")}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
