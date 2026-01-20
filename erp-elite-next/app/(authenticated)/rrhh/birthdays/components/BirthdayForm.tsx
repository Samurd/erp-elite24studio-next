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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RichSelect } from "@/components/ui/rich-select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DateService } from "@/lib/date-service";

const formSchema = z.object({
    is_employee: z.boolean(),
    employee_id: z.string().optional(),
    contact_id: z.string().optional(),
    date: z.string().min(1, "La fecha es requerida"),
    whatsapp: z.string().optional(),
    comments: z.string().optional(),
    responsible_id: z.string().optional(),
}).refine((data) => {
    if (data.is_employee) {
        return !!data.employee_id;
    } else {
        return !!data.contact_id;
    }
}, {
    message: "Debe seleccionar un empleado o contacto",
    path: ["employee_id"],
});

interface BirthdayFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: any;
    users: any[];
    employees: any[];
    contacts: any[];
}

export function BirthdayForm({
    open,
    onOpenChange,
    initialData,
    users,
    employees,
    contacts
}: BirthdayFormProps) {
    const queryClient = useQueryClient();

    // Map employees to RichSelect format
    const employeeOptions = employees.map(emp => ({
        id: emp.id,
        name: emp.fullName,
        ...emp
    }));

    // Contacts already have the correct format
    const contactOptions = contacts;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            is_employee: true,
            employee_id: "",
            contact_id: "",
            date: "",
            whatsapp: "",
            comments: "",
            responsible_id: "",
        },
    });

    const isEmployee = form.watch("is_employee");
    const selectedEmployeeId = form.watch("employee_id");

    // Auto-fill date when employee is selected
    useEffect(() => {
        if (isEmployee && selectedEmployeeId) {
            const employee = employees.find(e => e.id.toString() === selectedEmployeeId);
            if (employee && employee.birthDate) {
                form.setValue("date", DateService.toInput(employee.birthDate));
            }
        }
    }, [selectedEmployeeId, isEmployee, employees, form]);

    useEffect(() => {
        if (initialData) {
            form.reset({
                is_employee: !!initialData.employeeId,
                employee_id: initialData.employee?.id?.toString() || initialData.employeeId?.toString() || "",
                contact_id: initialData.contact?.id?.toString() || initialData.contactId?.toString() || "",
                date: DateService.toInput(initialData.date),
                whatsapp: initialData.whatsapp || "",
                comments: initialData.comments || "",
                responsible_id: initialData.responsible?.id?.toString() || initialData.responsibleId?.toString() || "",
            });
        } else {
            form.reset({
                is_employee: true,
                employee_id: "",
                contact_id: "",
                date: "",
                whatsapp: "",
                comments: "",
                responsible_id: "",
            });
        }
    }, [initialData, form, open]);

    const mutation = useMutation({
        mutationFn: async (values: z.infer<typeof formSchema>) => {
            const url = initialData ? `/api/rrhh/birthdays/${initialData.id}` : "/api/rrhh/birthdays";
            const method = initialData ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                throw new Error("Failed to save birthday");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["birthdays"] });
            toast.success(initialData ? "Cumpleaños actualizado" : "Cumpleaños creado");
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error("Error al guardar el cumpleaños");
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
                    <DialogTitle>{initialData ? "Editar Cumpleaños" : "Nuevo Cumpleaños"}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        {/* Type Selection */}
                        <FormField
                            control={form.control}
                            name="is_employee"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Registro</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={(value) => field.onChange(value === "true")}
                                            value={field.value ? "true" : "false"}
                                            className="flex gap-4"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="true" id="employee" />
                                                <label htmlFor="employee" className="cursor-pointer">Empleado</label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="false" id="contact" />
                                                <label htmlFor="contact" className="cursor-pointer">Contacto Externo</label>
                                            </div>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Employee Select */}
                            {isEmployee && (
                                <FormField
                                    control={form.control}
                                    name="employee_id"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Empleado <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <RichSelect
                                                    options={employeeOptions}
                                                    value={field.value ? parseInt(field.value) : undefined}
                                                    onValueChange={(val) => field.onChange(val?.toString())}
                                                    placeholder="Seleccionar empleado..."
                                                    showAvatar={false}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {/* Contact Select */}
                            {!isEmployee && (
                                <FormField
                                    control={form.control}
                                    name="contact_id"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Contacto <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <RichSelect
                                                    options={contactOptions}
                                                    value={field.value ? parseInt(field.value) : undefined}
                                                    onValueChange={(val) => field.onChange(val?.toString())}
                                                    placeholder="Seleccionar contacto..."
                                                    showAvatar={false}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha de Cumpleaños <span className="text-red-500">*</span></FormLabel>
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
                                        <FormLabel>Responsable de Gestión</FormLabel>
                                        <FormControl>
                                            <RichSelect
                                                options={users}
                                                value={field.value || undefined}
                                                onValueChange={field.onChange}
                                                placeholder="Seleccionar responsable..."
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="whatsapp"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>WhatsApp (Opcional)</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="+57 300 123 4567" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="comments"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Comentarios / Mensaje</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} rows={3} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
