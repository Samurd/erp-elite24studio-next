
"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import BillingAccountDetails from "./BillingAccountDetails";
import BillingAccountForm from "./BillingAccountForm";
import { useQuery } from "@tanstack/react-query";

type BillingAccountFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    invoiceId?: number; // If provided, edit mode
    viewMode?: boolean;
};

export default function BillingAccountFormModal({ isOpen, onClose, invoiceId, viewMode = false }: BillingAccountFormModalProps) {

    // Fetch data if editing or viewing
    const { data: invoice, isLoading } = useQuery({
        queryKey: ["billing-account", invoiceId],
        queryFn: async () => {
            if (!invoiceId) return null;
            const res = await fetch(`/api/finances/invoices/billing-accounts/${invoiceId}`);
            if (!res.ok) throw new Error("Failed to fetch billing account");
            return res.json();
        },
        enabled: !!invoiceId && isOpen, // Only fetch if ID exists and modal is open
        refetchOnMount: 'always', // Always refetch when component mounts
    });

    const isEditing = !!invoiceId && !viewMode;

    const getTitle = () => {
        if (viewMode) return `Detalle Cuenta de Cobro ${invoice?.code || ""}`;
        return isEditing ? "Editar Cuenta de Cobro" : "Crear Cuenta de Cobro";
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="min-w-4xl max-w-7xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{getTitle()}</DialogTitle>
                </DialogHeader>
                {isLoading ? (
                    <div className="p-8 text-center">Cargando datos...</div>
                ) : viewMode ? (
                    <BillingAccountDetails key={`view-${invoiceId}-${invoice?.files?.length || 0}`} invoice={invoice} />
                ) : (
                    <BillingAccountForm
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
