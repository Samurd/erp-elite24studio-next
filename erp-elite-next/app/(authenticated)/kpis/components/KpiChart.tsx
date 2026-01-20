
"use client";

import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface KpiRecord {
    recordDate: string;
    value: number;
}

interface KpiChartProps {
    records: KpiRecord[];
    indicatorName: string;
    targetValue: number | null;
}

export function KpiChart({ records, indicatorName, targetValue }: KpiChartProps) {
    // Sort records by date ascending for the chart
    const sortedRecords = [...records].sort((a, b) => new Date(a.recordDate).getTime() - new Date(b.recordDate).getTime());

    const data = {
        labels: sortedRecords.map(r => new Date(r.recordDate).toLocaleDateString('es-CO')),
        datasets: [
            {
                label: 'Valor',
                data: sortedRecords.map(r => r.value),
                borderColor: 'rgb(59, 130, 246)', // blue-500
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                tension: 0.3,
            },
            ...(targetValue !== null ? [{
                label: 'Meta',
                data: sortedRecords.map(() => targetValue),
                borderColor: 'rgb(34, 197, 94)', // green-500
                borderDash: [5, 5],
                pointRadius: 0,
            }] : [])
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Tendencia del Indicador',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            }
        }
    };

    return <Line options={options} data={data} />;
}
