
"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import ProviderDetails from "./ProviderDetails";
import ProviderForm from "./ProviderForm";
import { useQuery } from "@tanstack/react-query";

type ProviderFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    invoiceId?: number;
    viewMode?: boolean;
};

export default function ProviderFormModal({ isOpen, onClose, invoiceId, viewMode = false }: ProviderFormModalProps) {

    const { data: invoice, isLoading } = useQuery({
        queryKey: ["invoice-provider", invoiceId],
        queryFn: async () => {
            if (!invoiceId) return null;
            const res = await fetch(`/api/finances/invoices/providers/${invoiceId}`);
            if (!res.ok) throw new Error("Failed to fetch invoice");
            return res.json();
        },
        enabled: !!invoiceId && isOpen,
        refetchOnMount: 'always',
    });

    const isEditing = !!invoiceId && !viewMode;

    const getTitle = () => {
        if (viewMode) return `Detalle Factura ${invoice?.code || ""}`;
        return isEditing ? "Editar Factura Proveedor" : "Crear Factura Proveedor";
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
                    <ProviderDetails key={`view-${invoiceId}-${invoice?.files?.length || 0}`} invoice={invoice} />
                ) : (
                    <ProviderForm
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
