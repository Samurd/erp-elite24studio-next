import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { expenses, incomes, payrolls, taxRecords } from "@/drizzle/schema"
import { sql } from "drizzle-orm"

export async function GET() {
    try {
        const [expensesResult] = await db
            .select({ total: sql<number>`sum(${expenses.amount})` })
            .from(expenses)

        const [incomesResult] = await db
            .select({ total: sql<number>`sum(${incomes.amount})` })
            .from(incomes)

        const [payrollsResult] = await db
            .select({ total: sql<number>`sum(${payrolls.total})` })
            .from(payrolls)

        const [taxesResult] = await db
            .select({ total: sql<number>`sum(${taxRecords.amount})` })
            .from(taxRecords)

        const totalExpenses = Number(expensesResult?.total || 0)
        const totalGrossIncome = Number(incomesResult?.total || 0)
        const totalPayrolls = Number(payrollsResult?.total || 0)
        const totalTaxes = Number(taxesResult?.total || 0)

        const netIncome = totalGrossIncome - totalExpenses - totalPayrolls - totalTaxes

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
