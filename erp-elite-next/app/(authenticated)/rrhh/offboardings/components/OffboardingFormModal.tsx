
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DateService } from "@/lib/date-service";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { RichSelect } from "@/components/ui/rich-select";

const formSchema = z.object({
    employee_id: z.string().min(1, "El empleado es requerido"),
    project_id: z.string().optional(),
    reason: z.string().optional(),
    exit_date: z.string().min(1, "La fecha de salida es requerida"),
    status_id: z.string().optional(),
    responsible_id: z.string().optional(),
});

interface OffboardingFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    offboarding?: any; // If present, edit mode
}

export function OffboardingFormModal({
    open,
    onOpenChange,
    offboarding,
}: OffboardingFormModalProps) {
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            employee_id: "",
            project_id: "",
            reason: "",
            exit_date: DateService.todayInput(),
            status_id: "",
            responsible_id: "",
        },
    });

    // Reset form when modal opens/closes or when offboarding changes
    useEffect(() => {
        if (open) {
            if (offboarding) {
                form.reset({
                    employee_id: offboarding.employeeId?.toString() || "",
                    project_id: offboarding.projectId?.toString() || "",
                    reason: offboarding.reason || "",
                    exit_date: DateService.toInput(offboarding.exitDate),
                    status_id: offboarding.statusId?.toString() || "",
                    responsible_id: offboarding.responsibleId?.toString() || "",
                });
            } else {
                form.reset({
                    employee_id: "",
                    project_id: "",
                    reason: "",
                    exit_date: DateService.todayInput(),
                    status_id: "",
                    responsible_id: "",
                });
            }
        }
    }, [open, offboarding, form]);

    // Fetch Options
    const { data: options } = useQuery({
        queryKey: ["rrhh-options-all"],
        queryFn: async () => {
            const res = await fetch("/api/rrhh/options?slug=estado_offboarding&include=users&include2=employees");
            return res.json();
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const mutation = useMutation({
        mutationFn: async (values: z.infer<typeof formSchema>) => {
            const url = offboarding
                ? `/api/rrhh/offboardings/${offboarding.id}`
                : "/api/rrhh/offboardings";
            const method = offboarding ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            if (!res.ok) throw new Error("Failed to save");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["offboardings"] });
            toast.success("Éxito", {
                description: offboarding
                    ? "Proceso actualizado correctamente"
                    : "Proceso creado correctamente",
            });
            onOpenChange(false);
        },
        onError: () => {
            toast.error("Error", {
                description: "Ocurrió un error al guardar"
            })
        }
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        mutation.mutate(values);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {offboarding ? "Editar Proceso de OffBoarding" : "Nuevo Proceso de OffBoarding"}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="employee_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <RichSelect
                                            label="Empleado *"
                                            placeholder="Seleccionar empleado"
                                            options={options?.employees?.map((e: any) => ({
                                                ...e,
                                                id: e.id ? String(e.id) : "",
                                                name: e.fullName
                                            })) || []}
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            disabled={!!offboarding}
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="project_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <RichSelect
                                            label="Proyecto"
                                            placeholder="Seleccionar proyecto"
                                            options={options?.projects?.map((p: any) => ({
                                                ...p,
                                                id: p.id ? String(p.id) : "",
                                                name: p.name
                                            })) || []}
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            showAvatar={false}
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="exit_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha de Salida <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
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
                                                {options?.offboardingStatusOptions?.map((status: any) => (
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

                            <FormField
                                control={form.control}
                                name="responsible_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <RichSelect
                                            label="Responsable de Gestión"
                                            placeholder="Seleccionar responsable"
                                            options={options?.users?.map((u: any) => ({
                                                ...u,
                                                id: u.id ? String(u.id) : "",
                                                name: u.name
                                            })) || []}
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            imageKey="profilePhotoPath"
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Motivo / Razón de Salida</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Indique el motivo de la salida..."
                                            className="resize-none"
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700 text-white" disabled={mutation.isPending}>
                                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {offboarding ? "Actualizar" : "Guardar"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog >
    );
}
