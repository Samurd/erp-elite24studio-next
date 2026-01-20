
"use client";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ChartData,
    ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';
import { getQuarter } from 'date-fns';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const quarters = [
    { value: "1", label: 'Trimestre 1' },
    { value: "2", label: 'Trimestre 2' },
    { value: "3", label: 'Trimestre 3' },
    { value: "4", label: 'Trimestre 4' },
];

const currentYear = new Date().getFullYear();
const currentQuarter = getQuarter(new Date());
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

export default function WeeklyChart() {
    const [year, setYear] = useState<string>(currentYear.toString());
    const [quarter, setQuarter] = useState<string>(currentQuarter.toString());

    const { data, isLoading } = useQuery({
        queryKey: ['dashboard-weekly-chart', year, quarter],
        queryFn: async () => {
            const params = new URLSearchParams({ year, quarter });
            const res = await fetch(`/api/dashboard/weekly-chart?${params}`);
            if (!res.ok) throw new Error("Failed to fetch chart data");
            return res.json() as Promise<{ labels: string[], ingresos: number[], gastos: number[] }>;
        }
    });

    const chartData: ChartData<'line'> = {
        labels: data?.labels || [],
        datasets: [
            {
                label: 'Ingresos',
                backgroundColor: '#f87979',
                borderColor: '#c3933b',
                data: data?.ingresos || [],
                tension: 0.1
            },
            {
                label: 'Gastos',
                backgroundColor: '#000000',
                borderColor: '#000000',
                data: data?.gastos || [],
                tension: 0.1
            }
        ]
    };

    const chartOptions: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: false,
                text: 'Evolución semanal del ingreso neto'
            },
            legend: { display: false },
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
            y: { beginAtZero: true }
        }
    };

    return (
        <div className="w-full flex flex-col">
            <div className="flex justify-between flex-wrap items-center gap-2 mb-4">
                <h3 className="font-bold">Ingreso Neto Semanal por Trimestre</h3>
                <div className="flex gap-2">
                    <Select value={quarter} onValueChange={setQuarter}>
                        <SelectTrigger className="w-[120px] h-8 bg-white border-gray-300 text-xs shadow-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {quarters.map(q => (
                                <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={year} onValueChange={setYear}>
                        <SelectTrigger className="w-[80px] h-8 bg-white border-gray-300 text-xs shadow-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(y => (
                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="bg-white rounded-md p-4 h-64 shadow-sm relative">
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <Line data={chartData} options={chartOptions} />
                )}
            </div>
        </div>
    );
}
