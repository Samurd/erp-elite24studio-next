"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, TrendingUp, TrendingDown } from "lucide-react"
import MoneyDisplay from "@/components/ui/money-display"

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
)

const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const months = [
    { value: "all", label: 'Todo el año' },
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
const years = Array.from({ length: currentYear - 2019 + 1 }, (_, i) => currentYear - i);

export function NetStats() {
    // Global Filters
    const [year, setYear] = useState<string>(currentYear.toString());
    const [month, setMonth] = useState<string>("all");

    // Independent Chart Filters
    const [monthlyChartYear, setMonthlyChartYear] = useState<string>(currentYear.toString());
    const [categoryChartMonth, setCategoryChartMonth] = useState<string>((new Date().getMonth() + 1).toString());
    const [comparisonChartYear, setComparisonChartYear] = useState<string>(currentYear.toString());

    const { data: stats, isLoading } = useQuery({
        queryKey: ['net-stats', year, month, monthlyChartYear, categoryChartMonth, comparisonChartYear],
        queryFn: async () => {
            const params = new URLSearchParams({
                year,
                monthlyChartYear,
                categoryChartMonth,
                comparisonChartYear,
            });
            if (month !== "all") params.append("month", month);

            const res = await fetch(`/api/finances/net/stats?${params}`);
            if (!res.ok) throw new Error("Failed to fetch stats");
            return res.json();
        }
    });

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;
    }

    // --- Chart Options ---
    // --- Chart Options ---
    const commonOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: '#4b5563' } } // gray-600
        },
        scales: {
            y: { grid: { color: '#e5e7eb' }, ticks: { color: '#6b7280' } }, // gray-200, gray-500
            x: { grid: { color: '#e5e7eb' }, ticks: { color: '#6b7280' } }
        }
    };

    const noGridOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#4b5563' } } },
        scales: {
            y: { display: false },
            x: { display: false }
        }
    };

    const stackedChartOptions: any = {
        ...commonOptions,
        scales: {
            x: { stacked: true, grid: { color: '#e5e7eb' }, ticks: { color: '#6b7280' } },
            y: { stacked: true, grid: { color: '#e5e7eb' }, ticks: { color: '#6b7280' } }
        }
    };

    // --- Chart Data Construction ---

    const growthChartData = {
        labels: ['Periodo Anterior', 'Periodo Actual'],
        datasets: [{
            data: [stats?.previousPeriodIncome || 0, stats?.totalIncome || 0],
            backgroundColor: ['#cbd5e1', '#3b82f6'], // slate-300, blue-500
            borderWidth: 0
        }]
    };

    const monthlyChartData = {
        labels: monthLabels,
        datasets: [{
            label: 'Ingreso Neto',
            data: stats?.chartMonthlyData || [],
            backgroundColor: '#fbcfe8', // pink-200
            borderRadius: 4
        }]
    };

    const categoryChartData = {
        labels: stats?.chartCategoryLabels || [],
        datasets: [{
            label: 'Ingreso',
            data: stats?.chartCategoryData || [],
            backgroundColor: '#a5b4fc', // indigo-300
            borderRadius: 4
        }]
    };

    // Switch category chart to horizontal
    const categoryChartOptions: any = {
        ...commonOptions,
        indexAxis: 'y',
    };


    const areaChartData = {
        labels: stats?.chartAreaLabels || [],
        datasets: [{
            data: stats?.chartAreaData || [],
            backgroundColor: ['#818cf8', '#c084fc', '#f472b6', '#fb7185', '#38bdf8'],
            borderWidth: 0
        }]
    };

    const comparisonChartData = {
        labels: monthLabels,
        datasets: [
            {
                label: 'Año Actual',
                data: stats?.chartComparisonCurrent || [],
                backgroundColor: '#38bdf8',
                order: 1
            },
            {
                label: 'Año Anterior',
                data: stats?.chartComparisonLast || [],
                backgroundColor: '#94a3b8', // slate-400
                order: 2
            }
        ]
    };

    const stackedChartData = {
        labels: monthLabels,
        datasets: stats?.stackedChartData || []
    };


    return (
        <div className="space-y-6">
            {/* Header Filters */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-900">Finanzas Netas</h1>
                <div className="flex gap-2">
                    <Select value={year} onValueChange={setYear}>
                        <SelectTrigger className="w-[120px] bg-white border-gray-300 text-gray-900">
                            <SelectValue placeholder="Año" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200 text-gray-900">
                            {years.map(y => (
                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={month} onValueChange={setMonth}>
                        <SelectTrigger className="w-[140px] bg-white border-gray-300 text-gray-900">
                            <SelectValue placeholder="Mes" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200 text-gray-900">
                            {months.map(m => (
                                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-gray-900">
                    <div className="text-gray-500 text-sm mb-1 uppercase">Ingreso Neto Empresarial</div>
                    <MoneyDisplay value={stats?.totalIncome * 100} className="text-2xl font-bold" />
                    <div className="flex items-center gap-1 mt-2 text-xs">
                        {stats?.growthPercentage > 0 ? (
                            <span className="text-green-600 flex items-center"><TrendingUp className="h-3 w-3 mr-1" />{stats.growthPercentage.toFixed(1)}%</span>
                        ) : (
                            <span className="text-red-500 flex items-center"><TrendingDown className="h-3 w-3 mr-1" />{stats?.growthPercentage?.toFixed(1)}%</span>
                        )}
                        <span className="text-gray-500">vs periodo anterior</span>
                    </div>
                </div>

                {Object.entries(stats?.incomeByType || {}).map(([type, amount]: [string, any]) => (
                    <div key={type} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-gray-900">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="text-gray-500 text-sm mb-1 uppercase">{type}</div>
                                <MoneyDisplay value={amount * 100} className="text-2xl font-bold" />
                            </div>
                            <div className="p-2 bg-gray-100 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-gray-500" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>


            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Growth Chart */}
                <Card className="bg-white border-gray-200 text-gray-900 shadow-sm flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-lg">Porcentaje de Crecimiento</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-[200px] relative">
                        <Doughnut data={growthChartData} options={{ ...noGridOptions, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { color: '#4b5563' } } } } as any} />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-2xl font-bold text-gray-900">{stats?.growthPercentage?.toFixed(1)}%</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Monthly Income Chart */}
                <Card className="bg-white border-gray-200 text-gray-900 shadow-sm flex flex-col col-span-1 md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg">Ingreso Neto por Mes-Año</CardTitle>
                        <Select value={monthlyChartYear} onValueChange={setMonthlyChartYear}>
                            <SelectTrigger className="w-[100px] h-8 bg-white border-gray-300 text-gray-900 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-200 text-gray-900">
                                {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-[250px]">
                        <Bar data={monthlyChartData} options={commonOptions} />
                    </CardContent>
                </Card>
            </div>


            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Category Chart */}
                <Card className="bg-white border-gray-200 text-gray-900 shadow-sm flex flex-col col-span-1 md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg">Ingreso Neto por Categoría</CardTitle>
                        <Select value={categoryChartMonth} onValueChange={setCategoryChartMonth}>
                            <SelectTrigger className="w-[120px] h-8 bg-white border-gray-300 text-gray-900 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-200 text-gray-900">
                                {months.filter(m => m.value !== 'all').map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-[250px]">
                        <Bar data={categoryChartData} options={categoryChartOptions} />
                    </CardContent>
                </Card>

                {/* Area Donut Chart */}
                <Card className="bg-white border-gray-200 text-gray-900 shadow-sm flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-lg">Ingreso Neto por Áreas</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-[200px]">
                        <Doughnut data={areaChartData} options={{ ...noGridOptions, cutout: '60%', plugins: { legend: { position: 'right', labels: { color: '#4b5563' } } } } as any} />
                    </CardContent>
                </Card>
            </div>


            {/* Charts Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Comparison Chart */}
                <Card className="bg-white border-gray-200 text-gray-900 shadow-sm flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg">Comparativa Anual</CardTitle>
                        <Select value={comparisonChartYear} onValueChange={setComparisonChartYear}>
                            <SelectTrigger className="w-[100px] h-8 bg-white border-gray-300 text-gray-900 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-200 text-gray-900">
                                {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-[250px]">
                        <Bar data={comparisonChartData} options={commonOptions} />
                    </CardContent>
                </Card>

                {/* Stacked Chart */}
                <Card className="bg-white border-gray-200 text-gray-900 shadow-sm flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-lg">Categoría por Mes</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-[250px]">
                        <Bar data={stackedChartData} options={stackedChartOptions} />
                    </CardContent>
                </Card>
            </div>

        </div>
    )
}
