
"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DateService } from "@/lib/date-service";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import ModelAttachments from "@/components/cloud/ModelAttachments";

interface HolidayViewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    holidayId?: number;
    onEdit: (holidayId: number) => void;
}

export function HolidayViewModal({
    open,
    onOpenChange,
    holidayId,
    onEdit
}: HolidayViewModalProps) {
    const [year, setYear] = useState<string>(new Date().getFullYear().toString());

    const { data: holiday, isLoading } = useQuery({
        queryKey: ["holiday-details", holidayId, year],
        queryFn: async () => {
            if (!holidayId) return null;
            const res = await fetch(`/api/rrhh/holidays/${holidayId}?include_stats=true&year=${year}`);
            if (!res.ok) throw new Error("Failed to fetch details");
            return res.json();
        },
        enabled: !!holidayId && open,
    });

    if (!holidayId) return null;

    const yearOptions = Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 5 + i);

    const getDuration = (start: string, end: string) => {
        if (!start || !end) return '-';
        const s = new Date(start);
        const e = new Date(end);
        const diffTime = Math.abs(e.getTime() - s.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex justify-between items-center pr-8">
                        <div>
                            <DialogTitle className="text-xl">Detalles de Solicitud</DialogTitle>
                            <p className="text-sm text-gray-500 mt-1">{holiday?.employee?.fullName}</p>
                        </div>
                        <Button variant="outline" className="bg-yellow-600 text-white hover:bg-yellow-700 border-none" onClick={() => {
                            onOpenChange(false);
                            onEdit(holidayId);
                        }}>
                            Editar
                        </Button>
                    </div>
                </DialogHeader>

                {isLoading || !holiday ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <div className="space-y-6">

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Info Card */}
                            <div className="bg-white rounded-lg border p-4 shadow-sm md:col-span-1 h-fit">
                                <h3 className="font-semibold text-gray-800 border-b pb-2 mb-3">Información Actual</h3>
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase font-semibold">Tipo</span>
                                        <div className="font-medium text-gray-900">{holiday.type?.name || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase font-semibold">Fechas</span>
                                        <div className="font-medium text-gray-900">
                                            {DateService.toDisplayDate(holiday.startDate)} - {DateService.toDisplayDate(holiday.endDate)}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase font-semibold">Duración</span>
                                        <div className="font-medium text-gray-900">{getDuration(holiday.startDate, holiday.endDate)} días</div>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase font-semibold">Estado</span>
                                        <div className="mt-1">
                                            <Badge variant="secondary" className="bg-blue-50 text-blue-800 border-blue-100">
                                                {holiday.status?.name}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase font-semibold">Aprobador</span>
                                        <div className="font-medium text-gray-900">{holiday.approver?.name || 'Sin aprobar'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Files Card */}
                            <div className="bg-white rounded-lg border p-4 shadow-sm md:col-span-2 h-fit">
                                <div className="font-semibold text-gray-800 border-b pb-2 mb-3">Soportes Adjuntos</div>
                                <ModelAttachments
                                    modelId={holiday.id}
                                    modelType="App\Models\Holiday"
                                    initialFiles={holiday.files || []}
                                // readOnly={true} // Assuming we might want read-only view here, but component handles perms/logic usually. 
                                // The existing component seems to allow deletes if not configured otherwise. 
                                // For now passing params as is.
                                />
                            </div>
                        </div>

                        {/* Historical Data */}
                        <div className="bg-white rounded-lg border p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-4 pb-2 border-b">
                                <h3 className="font-bold text-gray-800">Histórico de Ausencias</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Año:</span>
                                    <Select value={year} onValueChange={setYear}>
                                        <SelectTrigger className="w-[100px] h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {yearOptions.map((y) => (
                                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Stats */}
                            {holiday.stats && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="bg-gray-50 p-3 rounded-lg border text-center">
                                        <div className="text-xs text-gray-500 uppercase font-semibold">Total Días ({year})</div>
                                        <div className="text-2xl font-bold text-gray-900">{holiday.stats.totalDays}</div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg border text-center">
                                        <div className="text-xs text-gray-500 uppercase font-semibold">Total Solicitudes</div>
                                        <div className="text-2xl font-bold text-gray-900">{holiday.stats.requestsInYear}</div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg border text-center">
                                        <div className="text-xs text-gray-500 uppercase font-semibold">Última Fecha</div>
                                        <div className="text-lg font-bold text-gray-900">
                                            {holiday.stats.lastDate ? DateService.toDisplayDate(holiday.stats.lastDate) : '-'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Fechas</th>
                                            <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Tipo</th>
                                            <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Días</th>
                                            <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {holiday.historicalData?.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 whitespace-nowrap text-gray-900">
                                                    {DateService.toDisplayDate(item.startDate)} - {DateService.toDisplayDate(item.endDate)}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                                                    {item.type?.name}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                                                    {getDuration(item.startDate, item.endDate)}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                        {item.status?.name}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {!holiday.historicalData?.length && (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-4 text-center text-gray-500 italic">
                                                    No hay registros para este año.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
