"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import MoneyDisplay from "@/components/ui/money-display"

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function PayrollsStatsPage() {
    const currentYear = new Date().getFullYear()
    const [yearStats, setYearStats] = useState(currentYear)
    const [yearTaxes, setYearTaxes] = useState(currentYear)
    const [yearPayrolls, setYearPayrolls] = useState(currentYear)
    const [yearDeductions, setYearDeductions] = useState(currentYear)

    const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

    const { data, isLoading } = useQuery({
        queryKey: ["payrolls-stats", yearStats, yearTaxes, yearPayrolls, yearDeductions],
        queryFn: async () => {
            const params = new URLSearchParams()
            params.set("yearStats", yearStats.toString())
            params.set("yearTaxes", yearTaxes.toString())
            params.set("yearPayrolls", yearPayrolls.toString())
            params.set("yearDeductions", yearDeductions.toString())

            const res = await fetch(`/api/finances/payrolls/stats?${params.toString()}`)
            if (!res.ok) throw new Error("Failed to fetch stats")
            return res.json()
        }
    })

    if (isLoading) return <div className="p-10 text-center">Cargando estadísticas...</div>

    const statusChartData = {
        labels: data?.statusLabels || [],
        datasets: [{
            label: 'Nóminas por Estado',
            data: data?.statusData || [],
            backgroundColor: ['rgba(59, 130, 246, 0.7)', 'rgba(34, 197, 94, 0.7)', 'rgba(251, 146, 60, 0.7)'],
            borderColor: ['rgba(59, 130, 246, 1)', 'rgba(34, 197, 94, 1)', 'rgba(251, 146, 60, 1)'],
            borderWidth: 1,
        }],
    }

    const genderChartData = {
        labels: data?.genderLabels || [],
        datasets: [{
            label: 'Nóminas por Género',
            data: data?.genderData || [],
            backgroundColor: ['rgba(236, 72, 153, 0.7)', 'rgba(59, 130, 246, 0.7)'],
            borderColor: ['rgba(236, 72, 153, 1)', 'rgba(59, 130, 246, 1)'],
            borderWidth: 1,
        }]
    }

    const deductionsChartData = {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        datasets: [{
            label: 'Deducciones (COP)',
            data: data?.deductionsData || [],
            backgroundColor: 'rgba(239, 68, 68, 0.7)',
        }]
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Estadísticas de Nóminas</h1>
                    <p className="text-muted-foreground">Análisis y métricas.</p>
                </div>
                <Link href="/finances/payrolls">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Nóminas
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Chart */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Nóminas por Estado</CardTitle>
                        <Select value={String(yearStats)} onValueChange={(v) => setYearStats(Number(v))}>
                            <SelectTrigger className="w-[100px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent className="h-[300px] flex justify-center">
                        <Doughnut data={statusChartData} />
                    </CardContent>
                </Card>

                {/* Gender Chart */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Nóminas por Género (Año: {yearStats})</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex justify-center">
                        <Doughnut data={genderChartData} />
                    </CardContent>
                </Card>

                {/* Deductions Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Deducciones Mensuales</CardTitle>
                        <Select value={String(yearDeductions)} onValueChange={(v) => setYearDeductions(Number(v))}>
                            <SelectTrigger className="w-[100px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <Bar
                            data={deductionsChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    y: {
                                        ticks: {
                                            callback: (value) => `$${value}`
                                        }
                                    }
                                }
                            }}
                        />
                    </CardContent>
                </Card>

                {/* Recent Payrolls */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Control Salarial Reciente</CardTitle>
                        <Select value={String(yearPayrolls)} onValueChange={(v) => setYearPayrolls(Number(v))}>
                            <SelectTrigger className="w-[100px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data?.recentPayrolls?.map((p: any) => (
                                <div key={p.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                                    <div>
                                        <p className="font-medium text-sm">{p.employee?.fullName || 'Sin empleado'}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <MoneyDisplay value={p.total} className="font-bold text-sm" />
                                        <span className="block text-xs text-blue-600">{p.status?.name}</span>
                                    </div>
                                </div>
                            ))}
                            {(!data?.recentPayrolls || data.recentPayrolls.length === 0) && (
                                <p className="text-center text-muted-foreground text-sm">No hay datos recientes.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Taxes */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Impuestos Recientes</CardTitle>
                        <Select value={String(yearTaxes)} onValueChange={(v) => setYearTaxes(Number(v))}>
                            <SelectTrigger className="w-[100px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data?.recentTaxes?.map((t: any) => (
                                <div key={t.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                                    <div>
                                        <p className="font-medium text-sm">{t.entity}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <MoneyDisplay value={t.amount} className="font-bold text-sm text-red-600" />
                                    </div>
                                </div>
                            ))}
                            {(!data?.recentTaxes || data.recentTaxes.length === 0) && (
                                <p className="text-center text-muted-foreground text-sm">No hay datos recientes.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
