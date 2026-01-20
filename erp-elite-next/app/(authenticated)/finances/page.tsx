"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import MoneyDisplay from "@/components/ui/money-display"
import DoughnutChart from "./components/DoughnutChart"
import { cn } from "@/lib/utils"

export default function FinancesPage() {
    const { data: summary, isLoading: isLoadingSummary } = useQuery({
        queryKey: ["finances-summary"],
        queryFn: async () => {
            const res = await fetch("/api/finances/summary")
            if (!res.ok) throw new Error("Failed to fetch summary")
            return res.json()
        }
    })

    const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
        queryKey: ["finances-transactions"],
        queryFn: async () => {
            const res = await fetch("/api/finances/transactions")
            if (!res.ok) throw new Error("Failed to fetch transactions")
            return res.json()
        }
    })

    const { data: charts, isLoading: isLoadingCharts } = useQuery({
        queryKey: ["finances-charts"],
        queryFn: async () => {
            const res = await fetch("/api/finances/charts")
            if (!res.ok) throw new Error("Failed to fetch charts")
            return res.json()
        }
    })

    const formatDate = (dateString: string) => {
        if (!dateString) return '-'
        const msg = new Date(dateString).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })

        // Simple relative time logic relative to today similar to Vue reference
        const d = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - d.getTime()
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return 'Hoy'
        if (diffDays === 1) return 'Ayer'

        return msg
    }

    const getStatusClass = (status: string) => {
        const lower = status?.toLowerCase() || ''
        if (lower.includes('completada') || lower.includes('pagada')) return 'bg-green-100 text-green-600'
        if (lower.includes('pendiente')) return 'bg-yellow-100 text-yellow-600'
        return 'bg-gray-100 text-gray-600'
    }

    const hasPayrollData = charts && (
        (charts.payrollPaymentsData?.data?.length || 0) > 0 ||
        (charts.payrollGenderData?.data?.length || 0) > 0
    )


    return (
        <div className="p-8 bg-gray-100 min-h-screen space-y-8">
            {/* GRID PRINCIPAL */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* COLUMNA IZQUIERDA: INGRESOS / GASTOS */}
                <div className="xl:col-span-4 space-y-6">
                    <h2 className="text-2xl font-bold text-gray-800">Balance General</h2>

                    {/* INGRESO NETO */}
                    <div className="bg-gradient-to-r from-black to-yellow-600 text-white rounded-2xl shadow-lg p-6 min-h-[250px] flex flex-col justify-between">
                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wide opacity-90">Ingresos neto empresarial</h3>
                            <div className="text-5xl font-bold my-3 flex gap-2 items-center">
                                {isLoadingSummary ? (
                                    <div className="h-12 w-32 bg-white/20 animate-pulse rounded" />
                                ) : (
                                    <MoneyDisplay value={summary?.netIncome} />
                                )}
                            </div>
                            <p className="text-sm opacity-90 leading-snug">
                                Consulta el total de ganancias totales de la
                                empresa, después de deducir los gastos
                                operativos y obligaciones financieras.
                            </p>
                        </div>
                        <Link href="/finances/net">
                            <span className="text-sm text-yellow-600 underline mt-2 self-start cursor-pointer hover:text-yellow-500">Ver Detalle</span>
                        </Link>
                    </div>

                    {/* INGRESO BRUTO */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 min-h-[250px] flex flex-col justify-between">
                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wide opacity-90">Ingresos bruto empresarial</h3>
                            <div className="text-5xl font-bold my-3 flex gap-2 items-center">
                                {isLoadingSummary ? (
                                    <div className="h-12 w-32 bg-gray-200 animate-pulse rounded" />
                                ) : (
                                    <MoneyDisplay value={summary?.totalGrossIncome} />
                                )}
                            </div>
                            <p className="text-sm text-gray-500 leading-snug">
                                Revisa el monta total de Ingresos generados
                                antes de aplicar deducciones y costos
                                operativos.
                            </p>
                        </div>
                        <Link href="/finances/gross">
                            <span className="text-sm text-yellow-600 underline mt-2 self-start cursor-pointer">Ver Detalle</span>
                        </Link>
                    </div>

                    {/* GASTOS */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 min-h-[250px] flex flex-col justify-between">
                        <div>
                            <h3 className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Gastos Totales</h3>
                            <div className="text-5xl font-bold text-gray-800 my-3 flex gap-2 items-center">
                                {isLoadingSummary ? (
                                    <div className="h-12 w-32 bg-gray-200 animate-pulse rounded" />
                                ) : (
                                    <MoneyDisplay value={summary?.totalExpenses} />
                                )}
                            </div>
                            <p className="text-sm text-gray-500 leading-snug">
                                Egresos registrados en el período actual: nómina, suministros, servicios y otros gastos
                                operativos.
                            </p>
                        </div>
                        <Link href="/finances/expenses">
                            <span className="text-sm text-yellow-600 underline mt-2 self-start cursor-pointer">Ver Detalle</span>
                        </Link>
                    </div>
                </div>

                {/* CENTRO: TRANSACCIONES */}
                <div className="xl:col-span-6 bg-white rounded-2xl shadow-lg p-6 flex flex-col relative">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-xl">Transacciones Recientes</h3>
                    </div>

                    <div className="overflow-y-auto border rounded-lg flex-1 relative min-h-[400px]">
                        {isLoadingTransactions && (
                            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
                            </div>
                        )}
                        <table className="w-full text-sm">
                            <thead className="bg-gradient-to-r from-black to-yellow-600 text-white uppercase font-semibold sticky top-0">
                                <tr>
                                    <th className="p-2 text-left">Descripción</th>
                                    <th className="p-2 text-center">Fecha</th>
                                    <th className="p-2 text-center">Monto</th>
                                    <th className="p-2 text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions?.map((transaction: any, index: number) => (
                                    <tr key={`${transaction.type}-${transaction.id}-${index}`} className="border-b hover:bg-gray-50">
                                        <td className="p-2">
                                            <span className="font-medium">{transaction.description}</span>
                                            <span className="block text-xs text-gray-500">{transaction.subtitle}</span>
                                        </td>
                                        <td className="p-2 text-center">
                                            {formatDate(transaction.date)}
                                        </td>
                                        <td className={cn(
                                            "p-2 text-center font-semibold",
                                            transaction.is_income ? 'text-green-500' : 'text-red-500'
                                        )}>
                                            <div className="flex items-center justify-center gap-1">
                                                <span>{transaction.is_income ? '+' : '-'}</span>
                                                <MoneyDisplay value={transaction.amount} />
                                            </div>
                                        </td>
                                        <td className="p-2 text-center">
                                            <span className={cn(
                                                "text-xs px-2 py-1 rounded",
                                                getStatusClass(transaction.status)
                                            )}>
                                                {transaction.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {!isLoadingTransactions && (!transactions || transactions.length === 0) && (
                                    <tr>
                                        <td colSpan={4} className="p-4 text-center text-gray-500">No hay transacciones recientes</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* DERECHA: FACTURACIÓN */}
                <div className="xl:col-span-2 space-y-6 w-full">
                    <h3 className="font-bold text-xl text-gray-800">Facturación</h3>

                    {/* Clientes Chart */}
                    <div className="bg-white p-4 rounded-2xl shadow relative min-h-[200px]">
                        {isLoadingCharts && (
                            <div className="absolute inset-0 bg-white/75 flex items-center justify-center z-10 rounded-2xl">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                            </div>
                        )}
                        <div className="flex justify-between text-sm font-semibold mb-2">
                            <span>Clientes</span>
                            <span className="text-gray-400 font-normal text-xs">Reciente</span>
                        </div>
                        <DoughnutChart
                            labels={charts?.clientInvoicesData?.labels}
                            data={charts?.clientInvoicesData?.data}
                            colors={charts?.clientInvoicesData?.colors}
                        />
                        <Link href="/finances/invoices/clients" className="text-yellow-600 text-xs underline mt-2 block text-center">
                            Ver Detalle
                        </Link>
                    </div>

                    {/* Cuentas de Cobro Chart */}
                    <div className="bg-white p-4 rounded-2xl shadow relative min-h-[200px]">
                        {isLoadingCharts && (
                            <div className="absolute inset-0 bg-white/75 flex items-center justify-center z-10 rounded-2xl">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                            </div>
                        )}
                        <div className="flex justify-between text-sm font-semibold mb-2">
                            <span>Cuentas de Cobro</span>
                            <span className="text-gray-400 font-normal text-xs">Reciente</span>
                        </div>
                        <DoughnutChart
                            labels={charts?.billingAccountsData?.labels}
                            data={charts?.billingAccountsData?.data}
                            colors={charts?.billingAccountsData?.colors}
                        />
                        <Link href="/finances/invoices/billing-accounts" className="text-yellow-600 text-xs underline mt-2 block text-center">
                            Ver Detalle
                        </Link>
                    </div>

                    {/* Proveedores Chart */}
                    <div className="bg-white p-4 rounded-2xl shadow relative min-h-[200px]">
                        {isLoadingCharts && (
                            <div className="absolute inset-0 bg-white/75 flex items-center justify-center z-10 rounded-2xl">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                            </div>
                        )}
                        <div className="flex justify-between text-sm font-semibold mb-2">
                            <span>Proveedores</span>
                            <span className="text-gray-400 font-normal text-xs">Reciente</span>
                        </div>
                        <DoughnutChart
                            labels={charts?.providerInvoicesData?.labels}
                            data={charts?.providerInvoicesData?.data}
                            colors={charts?.providerInvoicesData?.colors}
                        />
                        <Link href="/finances/invoices/providers" className="text-yellow-600 text-xs underline mt-2 block text-center">
                            Ver Detalle
                        </Link>
                    </div>
                </div>
            </div>

            {/* BLOQUES INFERIORES */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

                {/* Nómina */}
                <div className="bg-white p-6 rounded-2xl col-span-2 shadow-lg flex flex-col justify-between relative min-h-[300px]">
                    {isLoadingCharts && (
                        <div className="absolute inset-0 bg-white/75 flex items-center justify-center z-10 rounded-2xl">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
                        </div>
                    )}
                    <div>
                        <h3 className="font-bold text-lg mb-3">Gestión de Nómina</h3>
                        {!isLoadingCharts && !hasPayrollData ? (
                            <div className="text-center text-gray-500 py-8">
                                <p>No hay datos de nómina disponibles</p>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row items-center justify-around gap-4 h-full">
                                <div className="w-[140px]">
                                    <p className="text-xs text-center font-medium mb-2 text-gray-500">Estado Pagos</p>
                                    <DoughnutChart
                                        labels={charts?.payrollPaymentsData?.labels}
                                        data={charts?.payrollPaymentsData?.data}
                                        colors={charts?.payrollPaymentsData?.colors}
                                    />
                                </div>
                                <div className="w-[140px]">
                                    <p className="text-xs text-center font-medium mb-2 text-gray-500">Género</p>
                                    <DoughnutChart
                                        labels={charts?.payrollGenderData?.labels}
                                        data={charts?.payrollGenderData?.data}
                                        colors={charts?.payrollGenderData?.colors}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <Link href="/finances/payrolls/stats">
                        <span className="text-yellow-600 text-sm underline mt-3 self-start cursor-pointer hover:text-yellow-500">Ver Estadísticas</span>
                    </Link>
                </div>

                {/* Indicadores Financieros */}
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h3 className="font-bold text-lg mb-3">Analisis Financieros</h3>
                    <ul className="space-y-2">
                        <li>
                            <Link href="/finances/payrolls" className="bg-gray-800 text-white px-3 py-1 rounded inline-block hover:bg-gray-700 transition-colors text-sm">
                                Control Salarial
                            </Link>
                        </li>
                        <li>
                            <Link href="/finances/taxes" className="bg-gray-800 text-white px-3 py-1 rounded inline-block hover:bg-gray-700 transition-colors text-sm">
                                Impuestos laborales
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Cumplimiento Fiscal */}
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h3 className="font-bold text-lg mb-3">Cumplimiento Fiscal</h3>
                    <ul className="space-y-2">
                        <li>
                            <Link href="/finances/audits" className="bg-gray-800 text-white px-3 py-1 rounded inline-block hover:bg-gray-700 transition-colors text-sm">
                                Auditorías
                            </Link>
                        </li>
                        <li>
                            <Link href="/finances/norms" className="bg-gray-800 text-white px-3 py-1 rounded inline-block hover:bg-gray-700 transition-colors text-sm">
                                Normas NIF
                            </Link>
                        </li>
                    </ul>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <ul className="space-y-2">
                        <li>
                            <Link href="/finances/invoices" className="bg-gray-800 text-white px-3 py-1 rounded inline-block hover:bg-gray-700 transition-colors text-sm w-full text-center">
                                Registro de facturas
                            </Link>
                        </li>
                        <li>
                            <a
                                href="https://muisca.dian.gov.co"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-gradient-to-r from-black to-yellow-600 text-white px-3 py-2 rounded flex flex-col gap-1 items-center hover:opacity-90 transition-opacity"
                            >
                                <span className="text-sm font-semibold">Sistema de facturación</span>
                                <p className="text-[10px] text-gray-200 text-center leading-tight">Serás redirigido al Software de Facturacion- DIAN</p>
                                <ExternalLink className="w-3 h-3 text-white/70" />
                            </a>
                        </li>
                    </ul>
                </div>

            </div>
        </div>
    )
}
