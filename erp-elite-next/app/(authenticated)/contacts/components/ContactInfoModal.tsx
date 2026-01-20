"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ContactInfoModalProps {
    open: boolean;
    onClose: () => void;
    contact?: any | null;
}

import { DateService } from "@/lib/date-service";

interface ContactInfoModalProps {
    open: boolean;
    onClose: () => void;
    contact?: any | null;
}

export default function ContactInfoModal({ open, onClose, contact }: ContactInfoModalProps) {
    // Removed local formatDate function in favor of DateService.toDisplay

    if (!contact) return null;

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>Información del Contacto</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Nombre</p>
                            <p className="font-medium text-gray-900">{contact.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Email Personal</p>
                            <p className="font-medium text-gray-900">{contact.emailPersonal || "—"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Email Corporativo</p>
                            <p className="font-medium text-gray-900">{contact.emailCorporativo || "—"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Empresa</p>
                            <p className="font-medium text-gray-900">{contact.company}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Teléfono</p>
                            <p className="font-medium text-gray-900">{contact.phone || "—"}</p>
                        </div>
                    </div>
                    <hr className="my-2" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Tipo de contacto</p>
                            <p className="font-medium text-gray-900">{contact.contactType?.name || "—"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Tipo de relación</p>
                            <p className="font-medium text-gray-900">{contact.relationType?.name || "—"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Estado</p>
                            <p className="font-medium text-gray-900">{contact.status?.name || "—"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Fuente</p>
                            <p className="font-medium text-gray-900">{contact.source?.name || "—"}</p>
                        </div>
                    </div>
                    <hr className="my-2" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Fecha del primer contacto</p>
                            <p className="font-medium text-gray-900">{DateService.toDisplay(contact.firstContactDate)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Responsable</p>
                            <p className="font-medium text-gray-900">{contact.responsible?.name || "—"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Etiqueta</p>
                            {contact.label ? (
                                <span
                                    className="inline-block px-2 py-1 text-xs font-medium rounded"
                                    style={{
                                        backgroundColor: contact.label.color ? contact.label.color + '20' : '#f3f4f6',
                                        color: contact.label.color || '#1f2937'
                                    }}
                                >
                                    {contact.label.name}
                                </span>
                            ) : (
                                <span>—</span>
                            )}
                        </div>
                    </div>
                    {contact.notes && (
                        <div>
                            <p className="text-sm text-gray-500">Observaciones</p>
                            <p className="mt-1 p-3 rounded-md bg-gray-50 text-gray-700 text-sm">
                                {contact.notes}
                            </p>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
