
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { OffboardingTable } from "./components/OffboardingTable";
import { OffboardingFormModal } from "./components/OffboardingFormModal";
import { OffboardingViewModal } from "./components/OffboardingViewModal";

export default function OffboardingsPage() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [selectedOffboarding, setSelectedOffboarding] = useState<any>(null);

    const handleCreate = () => {
        setSelectedOffboarding(null);
        setIsFormOpen(true);
    };

    const handleEdit = (offboarding: any) => {
        setSelectedOffboarding(offboarding);
        setIsFormOpen(true);
    };

    const handleView = (offboarding: any) => {
        // Just set the ID, the modal will fetch full details including tasks
        setSelectedOffboarding(offboarding);
        setIsViewOpen(true);
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">OffBoardings</h1>
                    <p className="text-muted-foreground mt-1">Gestión de procesos de salida de empleados</p>
                </div>
                <Button onClick={handleCreate} className="bg-yellow-600 hover:bg-yellow-700 text-white shadow-sm">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Proceso
                </Button>
            </div>

            {/* Main Content */}
            <OffboardingTable onEdit={handleEdit} onView={handleView} />

            {/* Modals */}
            <OffboardingFormModal
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                offboarding={selectedOffboarding}
            />

            <OffboardingViewModal
                open={isViewOpen}
                onOpenChange={setIsViewOpen}
                offboardingId={selectedOffboarding?.id}
            />
        </div>
    );
}
