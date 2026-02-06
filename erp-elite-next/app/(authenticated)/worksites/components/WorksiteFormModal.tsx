
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RichSelect } from "@/components/ui/rich-select";
import { DateService } from "@/lib/date-service";

const worksiteSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    projectId: z.string().min(1, "El proyecto es requerido"),
    typeId: z.string().optional(),
    statusId: z.string().optional(),
    responsibleId: z.string().optional(),
    address: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

interface WorksiteFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    worksite?: any; // If present, edit mode
}

export function WorksiteFormModal({
    isOpen,
    onClose,
    worksite,
}: WorksiteFormModalProps) {
    const isEditing = !!worksite;
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof worksiteSchema>>({
        resolver: zodResolver(worksiteSchema),
        defaultValues: {
            name: "",
            projectId: "",
            typeId: "none",
            statusId: "none",
            responsibleId: "none",
            address: "",
            startDate: "",
            endDate: "",
        },
    });

    // Reset/Populate form on open
    useEffect(() => {
        if (isOpen) {
            if (worksite) {
                form.reset({
                    name: worksite.name,
                    projectId: worksite.projectId?.toString() || "",
                    typeId: worksite.typeId?.toString() || "none",
                    statusId: worksite.statusId?.toString() || "none",
                    responsibleId: worksite.responsibleId?.toString() || "none",
                    address: worksite.address || "",
                    startDate: DateService.toInput(worksite.startDate),
                    endDate: DateService.toInput(worksite.endDate),
                });
            } else {
                form.reset({
                    name: "",
                    projectId: "",
                    typeId: "none",
                    statusId: "none",
                    responsibleId: "none",
                    address: "",
                    startDate: "",
                    endDate: "",
                });
            }
        }
    }, [isOpen, worksite, form]);

    // Fetch Options
    const { data: options, isLoading: isLoadingOptions } = useQuery({
        queryKey: ["worksites-options"],
        queryFn: async () => {
            const res = await fetch("/api/worksites/options");
            if (!res.ok) throw new Error("Failed to fetch options");
            return res.json();
        },
        enabled: isOpen,
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: async (values: z.infer<typeof worksiteSchema>) => {
            const res = await fetch("/api/worksites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            if (!res.ok) throw new Error("Failed to create worksite");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Obra creada exitosamente");
            queryClient.invalidateQueries({ queryKey: ["worksites"] });
            onClose();
        },
        onError: () => toast.error("Error al crear la obra"),
    });

    const updateMutation = useMutation({
        mutationFn: async (values: z.infer<typeof worksiteSchema>) => {
            const res = await fetch(`/api/worksites/${worksite.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            if (!res.ok) throw new Error("Failed to update worksite");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Obra actualizada exitosamente");
            queryClient.invalidateQueries({ queryKey: ["worksites"] });
            queryClient.invalidateQueries({ queryKey: ["worksite"] });
            onClose();
        },
        onError: () => toast.error("Error al actualizar la obra"),
    });

    const onSubmit = (values: z.infer<typeof worksiteSchema>) => {
        if (isEditing) {
            updateMutation.mutate(values);
        } else {
            createMutation.mutate(values);
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Editar Obra" : "Nueva Obra"}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Project */}
                            <div className="md:col-span-2 relative z-30">
                                <FormField
                                    control={form.control}
                                    name="projectId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Proyecto <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <RichSelect
                                                    options={options?.projects || []}
                                                    value={field.value ? parseInt(field.value) : undefined}
                                                    onValueChange={(val) => field.onChange(val ? val.toString() : "")}
                                                    placeholder="Seleccionar proyecto"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Name */}
                            <div className="md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre de la Obra <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nombre de la obra" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Type */}
                            <FormField
                                control={form.control}
                                name="typeId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Obra</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar tipo" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">Sin tipo</SelectItem>
                                                {options?.types?.map((type: any) => (
                                                    <SelectItem key={type.id} value={type.id.toString()}>
                                                        {type.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Status */}
                            <FormField
                                control={form.control}
                                name="statusId"
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
                                                <SelectItem value="none">Sin estado</SelectItem>
                                                {options?.statuses?.map((status: any) => (
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

                            {/* Responsible */}
                            <div className="md:col-span-2 relative z-20">
                                <FormField
                                    control={form.control}
                                    name="responsibleId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Responsable</FormLabel>
                                            <FormControl>
                                                <RichSelect
                                                    options={options?.users || []}
                                                    value={field.value !== "none" ? field.value : undefined}
                                                    onValueChange={(val) => field.onChange(val?.toString() || "none")}
                                                    placeholder="Seleccionar responsable"
                                                    showAvatar={true}
                                                    imageKey="profilePhotoUrl"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Address */}
                            <div className="md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Dirección</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Dirección de la obra" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Dates */}
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha de Inicio</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha de Fin</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? "Actualizar" : "Guardar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
