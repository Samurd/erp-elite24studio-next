"use client"

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
} from 'chart.js'
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

const darkOptions = {
    responsive: true,
    plugins: {
        legend: {
            position: 'top' as const,
            labels: { color: "#e5e7eb" }
        },
        title: { display: false }
    },
    scales: {
        y: {
            grid: { color: "#374151" },
            ticks: { color: "#9ca3af" }
        },
        x: {
            grid: { display: false },
            ticks: { color: "#9ca3af" }
        }
    }
}

export default function ExpensesStats() {
    const yearChart1 = new Date().getFullYear().toString()
    const monthChart2 = (new Date().getMonth() + 1).toString()
    const yearTable = new Date().getFullYear().toString()

    const { data: stats, isLoading } = useQuery({
        queryKey: ["expenses-stats", yearChart1, monthChart2, yearTable],
        queryFn: () => fetch(`/api/finances/expenses/stats?yearChart1=${yearChart1}&monthChart2=${monthChart2}&yearTable=${yearTable}`).then(res => res.json())
    })

    if (isLoading) return <div className="p-4 text-gray-400">Cargando estadísticas...</div>

    if (!stats || stats.error) {
        return <div className="p-4 text-red-500">Error cargando estadísticas.</div>
    }

    // Chart 1: Month
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    const chart1Data = {
        labels: months,
        datasets: [{
            label: `Egresos ${yearChart1}`, // "Units" logic
            data: Object.values(stats.expenseByMonth || {}),
            backgroundColor: 'rgba(239, 68, 68, 0.5)', // Red for expenses
        }]
    }

    // Chart 2: Category
    const chart2Data = {
        labels: stats.expenseByCategoryLabels || [],
        datasets: [{
            label: `Categoría Mes ${monthChart2}`,
            data: stats.expenseByCategoryData || [],
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
        }]
    }

    return (
        <div className="space-y-6">
            {/* Totals Cards */}
            <div className="grid grid-cols-1 gap-4">
                <Card className="bg-[#252525] border-none shadow-md text-white">
                    <CardHeader className="pb-2 flex flex-row items-center space-x-2">
                        <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-purple-500 to-pink-400"></span>
                        <CardTitle className="text-sm font-semibold">Costos Directos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-gray-300 mb-2">Materiales usados, Pagos de contratistas, Costos de Equipos</p>
                        <MoneyDisplay value={stats.totals?.totalDirect} className="text-3xl font-bold" />
                    </CardContent>
                </Card>
                <Card className="bg-[#252525] border-none shadow-md text-white">
                    <CardHeader className="pb-2 flex flex-row items-center space-x-2">
                        <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-purple-500 to-pink-400"></span>
                        <CardTitle className="text-sm font-semibold">Gastos Indirectos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-gray-300 mb-2">Sueldos Administrativos, Servicios públicos, transporte, Oficinas, Viáticos.</p>
                        <MoneyDisplay value={stats.totals?.totalIndirect} className="text-3xl font-bold" />
                    </CardContent>
                </Card>
                <Card className="bg-[#252525] border-none shadow-md text-white">
                    <CardHeader className="pb-2 flex flex-row items-center space-x-2">
                        <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-purple-500 to-pink-400"></span>
                        <CardTitle className="text-sm font-semibold">Impuestos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-gray-300 mb-2">IVA, Retenciones en la Fuente, Renta, Seguridad Social, Prestaciones</p>
                        <MoneyDisplay value={stats.totals?.totalTaxes} className="text-3xl font-bold" />
                    </CardContent>
                </Card>
                <Card className="bg-[#252525] border-none shadow-md text-white">
                    <CardHeader className="pb-2 flex flex-row items-center space-x-2">
                        <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-purple-500 to-pink-400"></span>
                        <CardTitle className="text-sm font-semibold">Gastos Financieros</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-gray-300 mb-2">Pagos o entidades por créditos, Comisiones Bancarias, Mantenimiento de cuentas</p>
                        <MoneyDisplay value={stats.totals?.totalFinance} className="text-3xl font-bold" />
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-[#252525] border-none shadow-md text-white">
                <CardHeader>
                    <CardTitle className="text-sm font-semibold">Gastos por Mes–Año</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-56">
                        <Bar options={darkOptions} data={{ ...chart1Data, datasets: [{ ...chart1Data.datasets[0], backgroundColor: 'rgba(236,72,153,0.7)' }] }} />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-[#252525] border-none shadow-md text-white">
                <CardHeader>
                    <CardTitle className="text-sm font-semibold">Gastos por Categoría (Mes)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-56">
                        <Bar options={darkOptions} data={{ ...chart2Data, datasets: [{ ...chart2Data.datasets[0], backgroundColor: 'rgba(216,180,254,0.7)' }] }} />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-[#252525] border-none shadow-md text-white">
                <CardHeader>
                    <CardTitle className="text-sm font-semibold">TOP 5 Proveedores con mayores transacciones.</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-gray-700 hover:bg-transparent">
                                    <TableHead className="text-gray-400 font-normal">PROYECTO</TableHead>
                                    <TableHead className="text-gray-400 font-normal">MONTO</TableHead>
                                    <TableHead className="text-gray-400 font-normal text-center">FECHA</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats.topProjects?.map((item: any) => (
                                    <TableRow key={item.id} className="border-gray-800 hover:bg-gray-800/50">
                                        <TableCell>
                                            <div className="font-sm">{item.name}</div>
                                            <div className="text-xs text-gray-500">{item.category?.name || "-"}</div>
                                        </TableCell>
                                        <TableCell>
                                            <MoneyDisplay value={item.amount} className="text-red-400" />
                                        </TableCell>
                                        <TableCell className="text-center text-gray-400">
                                            {item.date ? DateService.toDisplay(item.date) : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!stats.topProjects || stats.topProjects.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-gray-500 py-4">No hay datos</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
