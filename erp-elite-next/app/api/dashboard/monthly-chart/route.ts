
import { db } from "@/lib/db";
import { expenses, incomes } from "@/drizzle";
import { and, gte, lte } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getDaysInMonth, startOfMonth, endOfMonth, format } from "date-fns";

export async function GET(req: Request) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

    // Calculate range
    const date = new Date(year, month - 1);
    const startDate = startOfMonth(date);
    const endDate = endOfMonth(date);

    const daysInMonth = getDaysInMonth(date);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Fetch Incomes (range)
    const incomesData = await db.select()
        .from(incomes)
        .where(and(gte(incomes.date, format(startDate, 'yyyy-MM-dd')), lte(incomes.date, format(endDate, 'yyyy-MM-dd'))));

    // Fetch Expenses (range)
    const expensesData = await db.select()
        .from(expenses)
        .where(and(gte(expenses.date, format(startDate, 'yyyy-MM-dd')), lte(expenses.date, format(endDate, 'yyyy-MM-dd'))));


    const incomeMap = new Map<number, number>();
    incomesData.forEach(i => {
        const day = new Date(i.date!).getDate() + 1; // +1 because getDate() is 1-31 but date string '2025-01-01' parsed might be timezone dep. 
        // Wait, '2025-01-01' parsed as UTC vs Local is tricky. 
        // Best to parse the string "YYYY-MM-DD" directly to get the day.
        const dayStr = i.date!.split('-')[2];
        const d = parseInt(dayStr);
        incomeMap.set(d, (incomeMap.get(d) || 0) + (Number(i.amount) || 0));
    });

    const expenseMap = new Map<number, number>();
    expensesData.forEach(e => {
        const dayStr = e.date!.split('-')[2];
        const d = parseInt(dayStr);
        expenseMap.set(d, (expenseMap.get(d) || 0) + (Number(e.amount) || 0));
    });

    const labels: string[] = [];
    const ingresos: number[] = [];
    const gastos: number[] = [];

    days.forEach(day => {
        labels.push(day.toString());
        ingresos.push((incomeMap.get(day) || 0) / 100);
        gastos.push((expenseMap.get(day) || 0) / 100);
    });

    return NextResponse.json({
        labels,
        ingresos,
        gastos
    });
}
