
"use client";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartData,
    ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const months = [
    { value: "1", label: 'Enero' },
    { value: "2", label: 'Febrero' },
    { value: "3", label: 'Marzo' },
    { value: "4", label: 'Abril' },
    { value: "5", label: 'Mayo' },
    { value: "6", label: 'Junio' },
    { value: "7", label: 'Julio' },
    { value: "8", label: 'Agosto' },
    { value: "9", label: 'Septiembre' },
    { value: "10", label: 'Octubre' },
    { value: "11", label: 'Noviembre' },
    { value: "12", label: 'Diciembre' },
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

export default function MonthlyChart() {
    const [year, setYear] = useState<string>(currentYear.toString());
    const [month, setMonth] = useState<string>(currentMonth.toString());

    const { data, isLoading } = useQuery({
        queryKey: ['dashboard-monthly-chart', year, month],
        queryFn: async () => {
            const params = new URLSearchParams({ year, month });
            const res = await fetch(`/api/dashboard/monthly-chart?${params}`);
            if (!res.ok) throw new Error("Failed to fetch chart data");
            return res.json() as Promise<{ labels: string[], ingresos: number[], gastos: number[] }>;
        }
    });

    const chartData: ChartData<'bar'> = {
        labels: data?.labels || [],
        datasets: [
            {
                label: 'Ingresos',
                backgroundColor: '#c3933b',
                data: data?.ingresos || []
            },
            {
                label: 'Gastos',
                backgroundColor: '#f87171', // Redish for expenses, or keep logical
                data: data?.gastos || []
            }
        ]
    };

    const chartOptions: ChartOptions<'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: false,
            },
            legend: {
                labels: {
                    color: '#ffffff'
                }
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: { color: '#ffffff' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            y: {
                beginAtZero: true,
                ticks: { color: '#ffffff' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            }
        }
    };

    return (
        <div className="bg-[#252525] rounded-md p-4 w-full md:h-[455px] shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-white font-semibold text-sm">Resumen Diario del Mes</h4>
                <div className="flex gap-2">
                    <Select value={month} onValueChange={setMonth}>
                        <SelectTrigger className="w-[110px] h-8 bg-[#333] border-none text-white text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#333] border-[#444] text-white">
                            {months.map(m => (
                                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={year} onValueChange={setYear}>
                        <SelectTrigger className="w-[80px] h-8 bg-[#333] border-none text-white text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#333] border-[#444] text-white">
                            {years.map(y => (
                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex-1 w-full min-h-0 relative">
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-white opacity-50" />
                    </div>
                ) : (
                    <Bar data={chartData} options={chartOptions} />
                )}
            </div>
        </div>
    );
}
