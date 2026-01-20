
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AttendancesTable } from "./components/AttendancesTable";
import { AttendancesConsolidatedTable } from "./components/AttendancesConsolidatedTable";
import { AttendanceFormModal } from "./components/AttendanceFormModal";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function AttendancesPage() {
    const [view, setView] = useState<'daily' | 'consolidated'>('daily');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedAttendance, setSelectedAttendance] = useState<any>(null);

    // Fetch Common Options
    const { data: options } = useQuery({
        queryKey: ["rrhh-options-attendances"],
        queryFn: async () => {
            // We need: employees, attendanceStatusOptions, attendanceModalityOptions
            const res = await fetch("/api/rrhh/options?slug=estado_asistencia&include=employees");
            return res.json();
        }
    });

    const handleCreate = () => {
        setSelectedAttendance(null);
        setIsFormOpen(true);
    };

    const handleEdit = (attendance: any) => {
        setSelectedAttendance(attendance);
        setIsFormOpen(true);
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Control de Asistencias</h1>
                    <p className="text-muted-foreground mt-1">Gestión de entradas, salidas y novedades</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* View Toggle */}
                    <div className="bg-gray-100 p-1 rounded-lg flex text-sm shadow-inner">
                        <button
                            onClick={() => setView('daily')}
                            className={cn(
                                "px-3 py-1.5 rounded-md transition-all font-medium",
                                view === 'daily' ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            Vista Diaria
                        </button>
                        <button
                            onClick={() => setView('consolidated')}
                            className={cn(
                                "px-3 py-1.5 rounded-md transition-all font-medium",
                                view === 'consolidated' ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            Vista Mensual
                        </button>
                    </div>

                    <Button onClick={handleCreate} className="bg-yellow-600 hover:bg-yellow-700 text-white shadow-sm">
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Registro
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            {view === 'daily' ? (
                <AttendancesTable onEdit={handleEdit} options={options} />
            ) : (
                <AttendancesConsolidatedTable options={options} />
            )}

            {/* Modals */}
            <AttendanceFormModal
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                attendance={selectedAttendance}
                options={options}
            />
        </div>
    );
}
