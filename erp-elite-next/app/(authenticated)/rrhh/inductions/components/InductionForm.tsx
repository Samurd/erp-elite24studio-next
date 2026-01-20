
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
import { DateService } from "@/lib/date-service";


const formSchema = z.object({
    employee_id: z.string().min(1, "El empleado es requerido"),
    type_bond_id: z.string().optional(),
    entry_date: z.string().min(1, "La fecha de ingreso es requerida"),
    responsible_id: z.string().optional(),
    date: z.string().optional(),
    status_id: z.string().optional(),
    confirmation_id: z.string().optional(),
    resource: z.string().optional(),
    duration: z.string().optional(),
    observations: z.string().optional(),
});

interface InductionFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: any;
    employees: any[];
    responsibles: any[];
    typeBondOptions: any[];
    statusOptions: any[];
    confirmationOptions: any[];
}

export function InductionForm({
    open,
    onOpenChange,
    initialData,
    employees,
    responsibles,
    typeBondOptions,
    statusOptions,
    confirmationOptions
}: InductionFormProps) {
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            employee_id: "",
            type_bond_id: "",
            entry_date: DateService.todayInput(),
            responsible_id: "",
            date: "",
            status_id: "",
            confirmation_id: "",
            resource: "",
            duration: "",
            observations: "",
        },
    });

    useEffect(() => {
        if (initialData) {
            form.reset({
                employee_id: initialData.employeeId?.toString() || "",
                type_bond_id: initialData.typeBondId?.toString() || "",
                entry_date: DateService.toInput(initialData.entryDate),
                responsible_id: initialData.responsibleId?.toString() || "",
                date: DateService.toInput(initialData.date),
                status_id: initialData.statusId?.toString() || "",
                confirmation_id: initialData.confirmationId?.toString() || "",
                resource: initialData.resource || "",
                duration: initialData.duration || "",
                observations: initialData.observations || "",
            });
        } else {
            form.reset({
                employee_id: "",
                type_bond_id: "",
                entry_date: DateService.todayInput(),
                responsible_id: "",
                date: DateService.todayInput(), // Default generally useful
                status_id: "",
                confirmation_id: "",
                resource: "",
                duration: "",
                observations: "",
            });
        }
    }, [initialData, form, open]);

    const mutation = useMutation({
        mutationFn: async (values: z.infer<typeof formSchema>) => {
            const url = initialData ? `/api/rrhh/inductions/${initialData.id}` : "/api/rrhh/inductions";
            const method = initialData ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                throw new Error("Failed to save induction");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inductions"] });
            toast.success(initialData ? "Inducción actualizada" : "Inducción creada");
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error("Error al guardar la inducción");
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
                    <DialogTitle>{initialData ? "Editar Inducción" : "Nueva Inducción"}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <FormField
                                control={form.control}
                                name="employee_id"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Empleado <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <RichSelect
                                                options={employees}
                                                value={field.value ? parseInt(field.value) : undefined}
                                                onValueChange={(val) => field.onChange(val?.toString())}
                                                placeholder="Seleccionar empleado"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="type_bond_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Vínculo</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {typeBondOptions.map((opt) => (
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
                                name="entry_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha de Ingreso <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="responsible_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Responsable</FormLabel>
                                        <FormControl>
                                            <RichSelect
                                                options={responsibles}
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
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha de Inducción</FormLabel>
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
                                                    <SelectValue placeholder="Seleccionar" />
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
                                name="confirmation_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirmación</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {confirmationOptions.map((opt) => (
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
                                name="resource"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Recurso</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Ej. Manual, Video, etc." />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="duration"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Duración</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
                                        </FormControl>
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

                        <div className="flex justify-end gap-3 pt-4">
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
