
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { HolidaysTable } from "./components/HolidaysTable";
import { HolidayFormModal } from "./components/HolidayFormModal";
import { HolidayViewModal } from "./components/HolidayViewModal";

export default function HolidaysPage() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [selectedHoliday, setSelectedHoliday] = useState<any>(null);

    const handleCreate = () => {
        setSelectedHoliday(null);
        setIsFormOpen(true);
    };

    const handleEdit = (holiday: any) => {
        // If we are coming from view modal, we might need to close it first if not managed automatically, 
        // but react state usually handles it if logic is sound.
        // We receive the full object or ID.
        // If it's just ID (from ViewModal), we might need to fetch it or rely on FormModal to handle it if we passed the full object.
        // The ViewModal passes ID to onEdit.
        if (typeof holiday === 'number') {
            // Need to handle getting the object or update FormModal to fetch by ID too.
            // For simplicity in this iteration, let's assume we need the object. 
            // BUT, ViewModal only has ID easily accessible or partial data.
            // Let's make FormModal capable of refetching or just use the data if available.
            // Current FormModal implementation expects 'holiday' object to prepopulate form.
            // A quick fix is to fetch it or pass it.
            // Ideally, we pass the object.
            // Since ViewModal has the full object details, we can pass it back or ...
            // Let's assume onEdit receives the object from Table, but ID from ViewModal.
            // I'll update ViewModal to pass the holiday object it fetched if possible, 
            // or I'll quickly fetch it here? No, better design:
            // Let's assume onEdit from ViewModal triggers a logic that sets selectedHoliday to a dummy object with ID,
            // and FormModal fetches fresh data if needed or we trust the cache.
            // *Correction*: FormModal uses 'holiday' prop to set defaultValues. It DOES NOT fetch fresh data for the form fields itself 
            // except for the files. It relies on the passed object.
            // So we really should pass the full object.
            // The ViewModal 'holiday' data is full. I'll update ViewModal to pass the full object.
        } else {
            setSelectedHoliday(holiday);
            setIsFormOpen(true);
        }
    };

    // Modified handleEdit to acccept ID from view modal (logic handled in ViewModal to pass object ideally)
    // Actually, let's look at ViewModal... it fetches "holiday-details".
    // We can just grab that query data if we want, but passing it is easier.

    const handleEditFromView = (holiday: any) => {
        setSelectedHoliday(holiday);
        setIsViewOpen(false);
        setIsFormOpen(true);
    }

    const handleView = (holiday: any) => {
        setSelectedHoliday(holiday);
        setIsViewOpen(true);
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Festivos y Vacaciones</h1>
                    <p className="text-muted-foreground mt-1">Gestión de ausencias, permisos y vacaciones</p>
                </div>
                <Button onClick={handleCreate} className="bg-yellow-600 hover:bg-yellow-700 text-white shadow-sm">
                    <Plus className="mr-2 h-4 w-4" /> Nueva Solicitud
                </Button>
            </div>

            {/* Main Content */}
            <HolidaysTable onEdit={handleEdit} onView={handleView} />

            {/* Modals */}
            <HolidayFormModal
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                holiday={selectedHoliday}
            />

            <HolidayViewModal
                open={isViewOpen}
                onOpenChange={setIsViewOpen}
                holidayId={selectedHoliday?.id}
                onEdit={(id) => {
                    // We need to pass the object. Since we don't have it easily here without fetching or complicating state
                    // We will just close View and open Form. 
                    // But Form needs data. 
                    // Quick hack: Use the selectedHoliday which was passed to View.
                    // It might be partial from Table... but ViewModal fetches full.
                    // If we want Form to have full data, we should pass what ViewModal has.
                    // But ViewModal renders conditional.
                    // Let's modify ViewModal to pass the full fetched object.
                    // For now, I'll rely on what 'selectedHoliday' has, which comes from Table.
                    // Table has: employee, type, status, dates. 
                    // Form needs: employee_id, type_id, etc. which are in the item from Table (employeeId, typeId).
                    // So passing the Table item is sufficient for Form defaults!
                    setIsViewOpen(false);
                    setIsFormOpen(true);
                }}
            />
        </div>
    );
}
