
import { auth, getUserWithPermissions } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import WeeklyChart from "@/components/dashboard/WeeklyChart";
import MonthlyChart from "@/components/dashboard/MonthlyChart";
import { db } from "@/lib/db";
import { expenses, incomes } from "@/drizzle";
import { sql } from "drizzle-orm";
import UserNotificationsView from "@/components/dashboard/UserNotificationsView";

export default async function DashboardPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user) {
        redirect("/login");
    }

    // Parallel data fetching
    const [totalIncomesResult, totalExpensesResult] = await Promise.all([
        db.select({ total: sql<number>`SUM(${incomes.amount})` }).from(incomes),
        db.select({ total: sql<number>`SUM(${expenses.amount})` }).from(expenses)
    ]);

    const totalIngresosRaw = Number(totalIncomesResult[0]?.total || 0);
    const totalGastosRaw = Number(totalExpensesResult[0]?.total || 0);

    const totalIngresos = totalIngresosRaw;
    const totalGastos = totalGastosRaw;
    const totalGeneral = totalIngresos - totalGastos;

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount / 100);
    };

    // Get permissions from database
    const userData = await getUserWithPermissions(session.user.id);
    const permissions = userData.permissions || [];

    const hasFinanceAccess = permissions.some(p => p === 'finanzas' || p.startsWith('finanzas.'));



    if (!hasFinanceAccess) {
        return <UserNotificationsView userId={session.user.id} />;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            {/* Columna izquierda (Gráficos) */}
            <div className="space-y-4">
                <WeeklyChart />
                <MonthlyChart />
            </div>

            {/* Columna derecha */}
            <div className="space-y-4">
                <div className="flex justify-between flex-wrap">
                    <h3 className="font-bold text-gray-800">Resumen de ganancias</h3>
                    <Link href="/finances" className="text-gray-600 hover:text-gray-900">Ver detalles</Link>
                </div>

                {/* Ingreso Neto Empresarial */}
                <div className="bg-gradient-to-r from-black via-[#b87c2b] to-[#c3933b] rounded-md p-4 text-white shadow-md">
                    <div className="flex justify-between">
                        <h3 className="">Ingreso neto Empresarial</h3>
                    </div>
                    <div className="mt-1">
                        <p className="font-bold text-[#fff]" style={{ fontSize: '33px' }}>
                            {formatMoney(totalGeneral)}
                        </p>
                    </div>
                    <div className="mt-2">
                        <Link href="/finances" className="hover:underline">
                            <p className="font-bold"><i className="fas fa-caret-right mr-2"></i>Ver Finanzas - Módulo Contabilidad</p>
                        </Link>
                        <p className="ml-2 mt-2 text-sm text-gray-100 opacity-90">Consulta el total de ganancias totales de la empresa, después de deducir los gastos operativos y obligaciones financieras.</p>
                    </div>
                </div>

                {/* Segundo bloque */}
                <div className="bg-white rounded-md p-4 mt-12 shadow-md">
                    <div className="flex justify-between">
                        <p className="ml-2 text-[#c3993b] text-[16px]">Ingreso Bruto Empresarial</p>
                    </div>
                    <div className="mt-2 space-y-2">
                        <p className="font-bold text-[#c3933b]" style={{ fontSize: '33px' }}>
                            {formatMoney(totalIngresos)}
                        </p>
                        <Link href="/finances" className="block hover:underline text-gray-800">
                            <p className="font-bold"><i className="fas fa-caret-right mr-2"></i>Ver Finanzas - Módulo Contabilidad</p>
                        </Link>
                        <p className="ml-2 text-gray-500">Revisa el monto total de ingresos generados antes de aplicar deducciones y costos operativos.</p>

                        <hr className="mb-5 mt-5 border-gray-200" />

                        <div className="flex justify-between">
                            <p className="ml-2 text-gray-700">Gastos</p>
                        </div>
                        <p className="font-bold text-[#000]" style={{ fontSize: '33px' }}>
                            {formatMoney(totalGastos)}
                        </p>
                        <Link href="/finances" className="block hover:underline text-gray-800">
                            <p className="font-bold"><i className="fas fa-caret-right mr-2"></i>Ver Finanzas - Módulo Contabilidad</p>
                        </Link>
                        <p className="ml-2 text-gray-500">Revisa el monto total de gastos y costos operativos de la empresa.</p>
                    </div>
                </div>
            </div>
        </div>

    );
}
