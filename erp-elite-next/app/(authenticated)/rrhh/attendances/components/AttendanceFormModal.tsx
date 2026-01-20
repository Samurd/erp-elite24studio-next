
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RichSelect } from "@/components/ui/rich-select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { DateService } from "@/lib/date-service";

const formSchema = z.object({
    employee_id: z.string().min(1, "El empleado es requerido"),
    date: z.string().min(1, "La fecha es requerida"),
    check_in: z.string().min(1, "Hora entrada requerida"),
    check_out: z.string().min(1, "Hora salida requerida"),
    status_id: z.string().optional(),
    modality_id: z.string().optional(),
    observations: z.string().optional(),
});

interface AttendanceFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    attendance?: any;
    options: any;
}

export function AttendanceFormModal({
    open,
    onOpenChange,
    attendance,
    options
}: AttendanceFormModalProps) {
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            employee_id: "",
            date: DateService.todayInput(),
            check_in: "",
            check_out: "",
            status_id: "",
            modality_id: "",
            observations: "",
        },
    });

    useEffect(() => {
        if (open) {
            if (attendance) {
                form.reset({
                    employee_id: attendance.employeeId?.toString() || "",
                    date: DateService.toInput(attendance.date),
                    check_in: attendance.checkIn ? attendance.checkIn.substring(0, 5) : "",
                    check_out: attendance.checkOut ? attendance.checkOut.substring(0, 5) : "",
                    status_id: attendance.statusId?.toString() || "",
                    modality_id: attendance.modalityId?.toString() || "",
                    observations: attendance.observations || "",
                });
            } else {
                form.reset({
                    employee_id: "",
                    date: DateService.todayInput(),
                    check_in: "",
                    check_out: "",
                    status_id: "",
                    modality_id: "",
                    observations: "",
                });
            }
        }
    }, [open, attendance, form]);

    const mutation = useMutation({
        mutationFn: async (values: z.infer<typeof formSchema>) => {
            const url = attendance ? `/api/rrhh/attendances/${attendance.id}` : "/api/rrhh/attendances";
            const method = attendance ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Error al guardar");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendances"] });
            toast.success("Éxito", {
                description: attendance
                    ? "Asistencia actualizada correctamente"
                    : "Asistencia registrada correctamente",
            });
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error("Error", {
                description: error.message || "Ocurrió un error al guardar"
            })
        }
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        mutation.mutate(values);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>{attendance ? "Editar Asistencia" : "Registrar Asistencia"}</DialogTitle>
                    <DialogDescription>
                        Ingrese los detalles del registro de asistencia.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <FormField
                                control={form.control}
                                name="employee_id"
                                render={({ field }) => (
                                    <FormItem className="col-span-1 md:col-span-2 flex flex-col">
                                        <FormLabel>Empleado <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <RichSelect
                                                options={options?.employees?.map((emp: any) => ({
                                                    ...emp,
                                                    id: emp.id.toString(),
                                                    name: emp.fullName
                                                })) || []}
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                placeholder="Seleccionar empleado"
                                                imageKey="profile_photo_url"
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
                                        <FormLabel>Fecha <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="modality_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Modalidad</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar modalidad" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {options?.attendanceModalityOptions?.map((mod: any) => (
                                                    <SelectItem key={mod.id} value={mod.id.toString()}>
                                                        {mod.name}
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
                                name="check_in"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Hora Entrada <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="check_out"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Hora Salida <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
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
                                                {options?.attendanceStatusOptions?.map((status: any) => (
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
                                name="observations"
                                render={({ field }) => (
                                    <FormItem className="col-span-1 md:col-span-2">
                                        <FormLabel>Observaciones</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} rows={3} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={mutation.isPending} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                                {mutation.isPending && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                                {attendance ? "Actualizar" : "Guardar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
