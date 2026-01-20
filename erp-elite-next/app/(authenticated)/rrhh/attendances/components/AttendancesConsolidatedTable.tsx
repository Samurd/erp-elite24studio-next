
"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttendancesConsolidatedTableProps {
    options: any; // Contains attendanceStatusOptions for table headers
}

export function AttendancesConsolidatedTable({ options }: AttendancesConsolidatedTableProps) {
    const [month, setMonth] = useState<string>((new Date().getMonth() + 1).toString());
    const [year, setYear] = useState<string>(new Date().getFullYear().toString());

    const fetchConsolidated = async () => {
        const params = new URLSearchParams({
            view: 'consolidated',
            month,
            year,
        });
        const res = await fetch(`/api/rrhh/attendances?${params}`);
        if (!res.ok) throw new Error("Failed to fetch consolidated data");
        return res.json();
    };

    const { data: consolidatedData, isLoading, isError } = useQuery({
        queryKey: ["attendances", "consolidated", month, year],
        queryFn: fetchConsolidated,
    });

    const months = [
        { value: "1", label: "Enero" },
        { value: "2", label: "Febrero" },
        { value: "3", label: "Marzo" },
        { value: "4", label: "Abril" },
        { value: "5", label: "Mayo" },
        { value: "6", label: "Junio" },
        { value: "7", label: "Julio" },
        { value: "8", label: "Agosto" },
        { value: "9", label: "Septiembre" },
        { value: "10", label: "Octubre" },
        { value: "11", label: "Noviembre" },
        { value: "12", label: "Diciembre" },
    ];

    const yearOptions = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 4 + i);
    const statusTags = options?.attendanceStatusOptions || [];

    if (isError) return <div className="p-4 text-red-500">Error al cargar datos consolidados</div>;

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col md:flex-row gap-4 items-center">
                <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Mes" />
                    </SelectTrigger>
                    <SelectContent>
                        {months.map((m) => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Año" />
                    </SelectTrigger>
                    <SelectContent>
                        {yearOptions.map((y) => (
                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="ml-auto text-sm text-gray-500">
                    Mostrando resumen de {months.find(m => m.value === month)?.label} {year}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50">
                                <TableHead className="w-32 sticky left-0 bg-gray-50 z-10 font-bold">Fecha</TableHead>
                                <TableHead className="text-center font-bold">Total Emp.</TableHead>
                                {statusTags.map((tag: any) => (
                                    <TableHead key={tag.id} className="text-center font-bold">{tag.name}</TableHead>
                                ))}
                                <TableHead className="font-bold">Notas</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={statusTags.length + 3} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                consolidatedData?.data?.map((day: any, index: number) => (
                                    <TableRow key={index} className={cn(day.special_day && "bg-gray-50")}>
                                        <TableCell className={cn("sticky left-0 z-10 font-medium", day.special_day ? "bg-gray-50" : "bg-white")}>
                                            {day.date} <span className="text-xs text-gray-500 ml-1">({day.day_name.substring(0, 3)})</span>
                                        </TableCell>
                                        <TableCell className="text-center text-gray-500">
                                            {day.total_employees}
                                        </TableCell>
                                        {statusTags.map((tag: any) => (
                                            <TableCell key={tag.id} className="text-center font-medium">
                                                {day.status_counts[tag.id] > 0 ? (
                                                    <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                                        {day.status_counts[tag.id]}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300">-</span>
                                                )}
                                            </TableCell>
                                        ))}
                                        <TableCell className="text-sm text-gray-500 italic">
                                            {day.special_day}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
