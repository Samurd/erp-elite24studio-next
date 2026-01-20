
import { db } from "@/lib/db";
import { expenses, incomes } from "@/drizzle";
import { and, gte, lte } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { startOfQuarter, endOfQuarter, eachWeekOfInterval, addDays, format, getQuarter, setQuarter, setYear } from "date-fns";

export async function GET(req: Request) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const quarter = parseInt(searchParams.get("quarter") || getQuarter(new Date()).toString());
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

    // Calculate start and end dates of the requested quarter
    let date = new Date(year, 0, 1);
    date = setYear(date, year);
    date = setQuarter(date, quarter);

    // Safety check if date became invalid? (unlikely with setYear/setQuarter ints)

    const startDate = startOfQuarter(date);
    const endDate = endOfQuarter(date);

    // Fetch Incomes (range)
    const incomesData = await db.select()
        .from(incomes)
        .where(and(gte(incomes.date, format(startDate, 'yyyy-MM-dd')), lte(incomes.date, format(endDate, 'yyyy-MM-dd'))));

    // Fetch Expenses (range)
    const expensesData = await db.select()
        .from(expenses)
        .where(and(gte(expenses.date, format(startDate, 'yyyy-MM-dd')), lte(expenses.date, format(endDate, 'yyyy-MM-dd'))));


    const weeks = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
    const labels: string[] = [];
    const ingresos: number[] = [];
    const gastos: number[] = [];

    weeks.forEach((weekStart, index) => {
        const weekEnd = addDays(weekStart, 6);
        const effectiveEnd = weekEnd > endDate ? endDate : weekEnd;

        labels.push(`Sem ${index + 1}`);

        // Sum incomes
        const weekIncomes = incomesData
            .filter(i => {
                const d = new Date(i.date!);
                return d >= weekStart && d <= effectiveEnd;
            })
            .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

        ingresos.push(weekIncomes / 100);

        // Sum expenses
        const weekExpenses = expensesData
            .filter(e => {
                const d = new Date(e.date!);
                return d >= weekStart && d <= effectiveEnd;
            })
            .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

        gastos.push(weekExpenses / 100);
    });

    return NextResponse.json({
        labels,
        ingresos,
        gastos
    });
}
