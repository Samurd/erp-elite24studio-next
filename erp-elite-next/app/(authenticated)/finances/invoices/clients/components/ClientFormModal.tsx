
"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import ClientDetails from "./ClientDetails";
import ClientForm from "./ClientForm";
import { useQuery } from "@tanstack/react-query";

type ClientFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    invoiceId?: number; // If provided, edit mode
    viewMode?: boolean;
};

export default function ClientFormModal({ isOpen, onClose, invoiceId, viewMode = false }: ClientFormModalProps) {

    // Fetch data if editing or viewing
    const { data: invoice, isLoading } = useQuery({
        queryKey: ["invoice", invoiceId],
        queryFn: async () => {
            if (!invoiceId) return null;
            const res = await fetch(`/api/finances/invoices/clients/${invoiceId}`);
            if (!res.ok) throw new Error("Failed to fetch invoice");
            return res.json();
        },
        enabled: !!invoiceId && isOpen, // Only fetch if ID exists and modal is open
        refetchOnMount: 'always', // Always refetch when component mounts
    });

    const isEditing = !!invoiceId && !viewMode;

    const getTitle = () => {
        if (viewMode) return `Detalle Factura ${invoice?.code || ""}`;
        return isEditing ? "Editar Factura DIAN" : "Crear Factura DIAN";
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="min-w-4xl max-w-7xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{getTitle()}</DialogTitle>
                </DialogHeader>
                {isLoading ? (
                    <div className="p-8 text-center">Cargando datos de factura...</div>
                ) : viewMode ? (
                    <ClientDetails key={`view-${invoiceId}-${invoice?.files?.length || 0}`} invoice={invoice} />
                ) : (
                    <ClientForm
                        key={`edit-${invoiceId}-${invoice?.files?.length || 0}`}
                        invoice={invoice}
                        isEditing={isEditing}
                        onSuccess={onClose}
                        onCancel={onClose}
                        hideTitle
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
