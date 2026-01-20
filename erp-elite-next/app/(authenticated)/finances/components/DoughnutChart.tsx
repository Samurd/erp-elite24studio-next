"use client"

import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { useMemo } from 'react'

ChartJS.register(ArcElement, Tooltip, Legend)

interface DoughnutChartProps {
    labels?: string[]
    data?: number[]
    colors?: string[]
}

export default function DoughnutChart({ labels = [], data = [], colors = [] }: DoughnutChartProps) {
    const hasData = data && data.length > 0

    const chartData = useMemo(() => ({
        labels: labels,
        datasets: [{
            data: data,
            backgroundColor: colors,
            borderWidth: 0
        }]
    }), [labels, data, colors])

    const chartOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%', // Thinner ring like in design
        plugins: {
            legend: { display: false },
            tooltip: {
                enabled: true,
                callbacks: {
                    label: (context: any) => {
                        const label = context.label || ''
                        const value = context.raw || 0
                        return `${label}: ${value}%`
                    }
                }
            }
        }
    }

    if (!hasData) {
        return (
            <div className="flex justify-center items-center h-[150px]">
                <div className="text-center text-gray-500 text-xs">
                    <p>No hay datos disponibles</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex justify-center items-center h-[150px] w-full">
            <div className="relative h-[120px] w-[120px]">
                {/* Fixed size container for chart consistency */}
                <Doughnut data={chartData} options={chartOptions} />
            </div>
        </div>
    )
}
