import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { expenses, incomes } from "@/drizzle/schema"
import { sql } from "drizzle-orm"

export async function GET() {
    try {
        const [expensesResult] = await db
            .select({ total: sql<number>`sum(${expenses.amount})` })
            .from(expenses)

        const [incomesResult] = await db
            .select({ total: sql<number>`sum(${incomes.amount})` })
            .from(incomes)

        const totalExpenses = Number(expensesResult?.total || 0)
        const totalGrossIncome = Number(incomesResult?.total || 0)
        const netIncome = totalGrossIncome - totalExpenses

        return NextResponse.json({
            totalExpenses,
            totalGrossIncome,
            netIncome
        })
    } catch (error) {
        console.error("Error fetching finances summary:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
