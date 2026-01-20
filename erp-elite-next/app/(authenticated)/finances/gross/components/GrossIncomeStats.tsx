"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Bar } from "react-chartjs-2"
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from "chart.js"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import MoneyDisplay from "@/components/ui/money-display"
import { DateService } from "@/lib/date-service"

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
)

export default function GrossIncomeStats() {
    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 6 }, (_, i) => currentYear - i)
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

    const [filters, setFilters] = useState({
        yearChart1: currentYear.toString(),
        monthChart2: (new Date().getMonth() + 1).toString(),
        yearTable: currentYear.toString()
    })

    const { data: stats, isLoading } = useQuery({
        queryKey: ["gross-stats", filters.yearChart1, filters.monthChart2, filters.yearTable],
        queryFn: async () => {
            const params = new URLSearchParams({
                yearChart1: filters.yearChart1,
                monthChart2: filters.monthChart2,
                yearTable: filters.yearTable
            })
            const res = await fetch(`/api/finances/gross/stats?${params}`)
            if (!res.ok) throw new Error("Failed to fetch stats")
            return res.json()
        }
    })

    const chart1Data = {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        datasets: [
            {
                label: 'Ingreso por mes',
                data: stats?.grossByMonth || [],
                backgroundColor: 'rgba(134, 239, 172, 0.7)', // green-300 like
                borderRadius: 4,
            },
        ],
    }

    const chart2Data = {
        labels: stats?.grossByCategoryLabels || [],
        datasets: [
            {
                label: 'Ingreso por categoría',
                data: stats?.grossByCategoryData || [],
                backgroundColor: 'rgba(134, 239, 172, 0.7)',
                borderRadius: 4,
            },
        ],
    }

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: '#9ca3af'
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: '#9ca3af'
                }
            }
        },
        maintainAspectRatio: false
    }

    return (
        <div className="space-y-6">
            {/* Chart 1 */}
            <div className="bg-[#252525] text-white p-4 rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold">Ingreso por Mes–Año</h3>
                    <select
                        value={filters.yearChart1}
                        onChange={(e) => setFilters(prev => ({ ...prev, yearChart1: e.target.value }))}
                        className="bg-gray-800 text-sm rounded-md px-2 py-1 border-none focus:ring-1 focus:ring-gray-600 outline-none cursor-pointer"
                    >
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
                <div className="h-[200px] w-full">
                    {/* @ts-ignore */}
                    <Bar data={chart1Data} options={chartOptions} />
                </div>
            </div>

            {/* Chart 2 */}
            <div className="bg-[#252525] text-white p-4 rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold">Ingreso por Categoría (Mes)</h3>
                    <select
                        value={filters.monthChart2}
                        onChange={(e) => setFilters(prev => ({ ...prev, monthChart2: e.target.value }))}
                        className="bg-gray-800 text-sm rounded-md px-2 py-1 border-none focus:ring-1 focus:ring-gray-600 outline-none cursor-pointer"
                    >
                        {monthNames.map((m, i) => (
                            <option key={i} value={i + 1}>{m}</option>
                        ))}
                    </select>
                </div>
                <div className="h-[200px] w-full">
                    {/* @ts-ignore */}
                    <Bar data={chart2Data} options={chartOptions} />
                </div>
            </div>

            {/* Top 5 Table */}
            <div className="bg-[#252525] text-white p-4 rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold">TOP 5 Ingresos con mayores transacciones.</h3>
                    <select
                        value={filters.yearTable}
                        onChange={(e) => setFilters(prev => ({ ...prev, yearTable: e.target.value }))}
                        className="bg-gray-800 text-sm rounded-md px-2 py-1 border-none focus:ring-1 focus:ring-gray-600 outline-none cursor-pointer"
                    >
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead className="border-b border-gray-700 text-gray-400 uppercase">
                            <tr>
                                <th className="p-2 text-left font-medium">Nombre</th>
                                <th className="p-2 text-left font-medium">Categoría</th>
                                <th className="p-2 text-center font-medium">Monto</th>
                                <th className="p-2 text-center font-medium">Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.topProjects?.length > 0 ? (
                                stats.topProjects.map((item: any) => (
                                    <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                                        <td className="p-2 truncate max-w-[120px]" title={item.name}>{item.name}</td>
                                        <td className="p-2 truncate max-w-[100px]">{item.category?.name || 'Sin categoría'}</td>
                                        <td className="p-2 text-center">
                                            <MoneyDisplay value={item.amount} className="text-green-400" />
                                        </td>
                                        <td className="p-2 text-center text-gray-400">
                                            {item.date ? DateService.toDisplay(item.date) : '-'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="text-center text-gray-500 py-4">No hay datos</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
