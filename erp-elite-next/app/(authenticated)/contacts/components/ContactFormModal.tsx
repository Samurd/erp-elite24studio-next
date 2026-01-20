"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichSelect } from "@/components/ui/rich-select";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { DateService } from "@/lib/date-service";

interface Option {
    id: number;
    name: string;
    color?: string;
}

interface UserOption {
    id: string; // IDs for users are strings in schema
    name: string;
}

interface ContactFormModalProps {
    open: boolean;
    onClose: () => void;
    contact?: any | null;
    options: {
        users: UserOption[];
        labels: Option[];
        contactTypes: Option[];
        relationTypes: Option[];
        states: Option[];
        sources: Option[];
    };
}

export default function ContactFormModal({ open, onClose, contact, options }: ContactFormModalProps) {
    const isEdit = !!contact;
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        name: "",
        email_personal: "",
        email_corporativo: "",
        company: "",
        phone: "",
        address: "",
        city: "",
        contact_type_id: "",
        relation_type_id: "",
        status_id: "",
        source_id: "",
        label_id: "",
        responsible_id: "",
        first_contact_date: "",
        notes: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (contact) {
            setFormData({
                name: contact.name || "",
                email_personal: contact.emailPersonal || "",
                email_corporativo: contact.emailCorporativo || "",
                company: contact.company || "",
                phone: contact.phone || "",
                address: contact.address || "",
                city: contact.city || "",
                contact_type_id: contact.contactTypeId?.toString() || "",
                relation_type_id: contact.relationTypeId?.toString() || "",
                status_id: contact.statusId?.toString() || "",
                source_id: contact.sourceId?.toString() || "",
                label_id: contact.labelId?.toString() || "",
                responsible_id: contact.responsible?.id?.toString() || contact.responsibleId?.toString() || "",
                first_contact_date: DateService.toInput(contact.firstContactDate),
                notes: contact.notes || "",
            });
        } else {
            resetForm();
        }
    }, [contact, open]);

    const mutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const url = isEdit ? `/api/contacts/${contact.id}` : "/api/contacts";
            const method = isEdit ? "PUT" : "POST";

            // Map data to match schema/API expectations if needed.
            // API expects camelCase or snake_case depending on how it reads it.
            // My API implementation: `...body` into `db.insert`/`update`. Drizzle uses camelCase keys usually but the schema has column mapping.
            // Wait, schema keys are camelCase (contactTypeId), but column names are snake_case.
            // Drizzle `values()` usually expects keys matching the schema definition keys (camelCase).
            // So if I send snake_case keys (contact_type_id), Drizzle might ignore them if I pass `...body` directly unless I mapped them.
            // In API `POST`: `const body = await request.json(); await db.insert(contacts).values({...body})`.
            // Because my schema defines `contacts` with keys like `contactTypeId`, I MUST send `contactTypeId`.
            // The frontend state uses snake_case because I copied from Laravel logic mentally, but I should switch to camelCase or map it.
            // I'll map it here before sending.

            const payload = {
                name: data.name,
                emailPersonal: data.email_personal,
                emailCorporativo: data.email_corporativo,
                company: data.company,
                phone: data.phone,
                address: data.address,
                city: data.city,
                contactTypeId: data.contact_type_id ? parseInt(data.contact_type_id) : null,
                relationTypeId: data.relation_type_id ? parseInt(data.relation_type_id) : null,
                statusId: data.status_id ? parseInt(data.status_id) : null,
                sourceId: data.source_id ? parseInt(data.source_id) : null,
                labelId: data.label_id ? parseInt(data.label_id) : null,
                responsibleId: data.responsible_id || null,
                firstContactDate: data.first_contact_date ? new Date(data.first_contact_date) : null,
                notes: data.notes,
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const error = await res.json();
                throw error; // Contains .errors
            }

            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contacts"] });
            onClose();
            resetForm();
        },
        onError: (error: any) => {
            if (error.errors) {
                setErrors(error.errors);
            } else {
                alert("Error al guardar contacto");
            }
        },
    });

    const resetForm = () => {
        setFormData({
            name: "",
            email_personal: "",
            email_corporativo: "",
            company: "",
            phone: "",
            address: "",
            city: "",
            contact_type_id: "",
            relation_type_id: "",
            status_id: "",
            source_id: "",
            label_id: "",
            responsible_id: "",
            first_contact_date: "",
            notes: "",
        });
        setErrors({});
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        mutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Editar Contacto" : "Nuevo Contacto"}</DialogTitle>
                    <DialogDescription>
                        Complete la información del contacto.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre Completo</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                        </div>

                        {/* Company */}
                        <div className="space-y-2">
                            <Label htmlFor="company">Empresa</Label>
                            <Input
                                id="company"
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                required
                            />
                            {errors.company && <p className="text-sm text-red-500">{errors.company}</p>}
                        </div>

                        {/* Email Personal */}
                        <div className="space-y-2">
                            <Label htmlFor="email_personal">Email Personal</Label>
                            <Input
                                id="email_personal"
                                type="email"
                                value={formData.email_personal}
                                onChange={(e) => setFormData({ ...formData, email_personal: e.target.value })}
                            />
                        </div>

                        {/* Email Corporativo */}
                        <div className="space-y-2">
                            <Label htmlFor="email_corporativo">Email Corporativo</Label>
                            <Input
                                id="email_corporativo"
                                type="email"
                                value={formData.email_corporativo}
                                onChange={(e) => setFormData({ ...formData, email_corporativo: e.target.value })}
                            />
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        {/* City */}
                        <div className="space-y-2">
                            <Label htmlFor="city">Ciudad</Label>
                            <Input
                                id="city"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Dirección</Label>
                        <textarea
                            id="address"
                            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Responsible */}
                        <div className="space-y-2">

                            <Label>Responsable</Label>
                            <RichSelect
                                value={formData.responsible_id || undefined}
                                onValueChange={(val) => setFormData({ ...formData, responsible_id: val?.toString() })}
                                options={options.users}
                                placeholder="Seleccionar responsable"
                                label=""
                                imageKey="image"
                            />
                        </div>

                        {/* First Contact Date */}
                        <div className="space-y-2">
                            <Label htmlFor="first_contact_date">Fecha Primer Contacto</Label>
                            <Input
                                id="first_contact_date"
                                type="date"
                                value={formData.first_contact_date}
                                onChange={(e) => setFormData({ ...formData, first_contact_date: e.target.value })}
                            />
                        </div>

                        {/* Contact Type */}
                        <div className="space-y-2">
                            <Label>Tipo de Contacto</Label>
                            <Select value={formData.contact_type_id} onValueChange={(val) => setFormData({ ...formData, contact_type_id: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {options.contactTypes?.map(o => (
                                        <SelectItem key={o.id} value={o.id.toString()}>{o.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Relation Type */}
                        <div className="space-y-2">
                            <Label>Tipo de Relación</Label>
                            <Select value={formData.relation_type_id} onValueChange={(val) => setFormData({ ...formData, relation_type_id: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {options.relationTypes?.map(o => (
                                        <SelectItem key={o.id} value={o.id.toString()}>{o.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <Label>Estado</Label>
                            <Select value={formData.status_id} onValueChange={(val) => setFormData({ ...formData, status_id: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    {options.states?.map(o => (
                                        <SelectItem key={o.id} value={o.id.toString()}>{o.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Source */}
                        <div className="space-y-2">
                            <Label>Fuente</Label>
                            <Select value={formData.source_id} onValueChange={(val) => setFormData({ ...formData, source_id: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar fuente" />
                                </SelectTrigger>
                                <SelectContent>
                                    {options.sources?.map(o => (
                                        <SelectItem key={o.id} value={o.id.toString()}>{o.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Label */}
                        <div className="space-y-2">
                            <Label>Etiqueta</Label>
                            <Select value={formData.label_id} onValueChange={(val) => setFormData({ ...formData, label_id: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar etiqueta" />
                                </SelectTrigger>
                                <SelectContent>
                                    {options.labels?.map(o => (
                                        <SelectItem key={o.id} value={o.id.toString()}>{o.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Observaciones</Label>
                        <textarea
                            id="notes"
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? "Guardando..." : isEdit ? "Actualizar" : "Crear"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
