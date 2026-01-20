import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { invoices, expenses, incomes, contacts, tags } from "@/drizzle/schema"
import { desc, eq, sql } from "drizzle-orm"

export async function GET() {
    try {
        // 1. Fetch Invoices
        const invoicesResult = await db.query.invoices.findMany({
            with: {
                contact: true,
                tag: true // 'status' relation is named 'tag' in relations.ts
            },
            limit: 10,
            orderBy: [desc(invoices.invoiceDate)]
        })

        const mappedInvoices = invoicesResult.map(inv => ({
            id: inv.id,
            type: 'invoice',
            description: inv.contact?.name || 'Sin contacto',
            subtitle: inv.code,
            date: inv.invoiceDate,
            amount: Number(inv.total),
            is_income: true,
            status: inv.tag?.name || 'Sin estado'
        }))

        // 2. Fetch Expenses
        const expensesResult = await db.query.expenses.findMany({
            with: {
                tag_categoryId: true // 'category' relation is named 'tag_categoryId'
            },
            limit: 10,
            orderBy: [desc(expenses.date)]
        })

        const mappedExpenses = expensesResult.map(exp => ({
            id: exp.id,
            type: 'expense',
            description: exp.name,
            subtitle: exp.tag_categoryId?.name || 'Sin categoría',
            date: exp.date,
            amount: Number(exp.amount),
            is_income: false,
            status: 'Completada'
        }))

        // 3. Fetch Incomes
        const incomesResult = await db.query.incomes.findMany({
            with: {
                tag_categoryId: true // 'category' relation is named 'tag_categoryId'
            },
            limit: 10,
            orderBy: [desc(incomes.date)]
        })

        const mappedIncomes = incomesResult.map(inc => ({
            id: inc.id,
            type: 'income',
            description: inc.name,
            subtitle: inc.tag_categoryId?.name || 'Sin categoría',
            date: inc.date,
            amount: Number(inc.amount),
            is_income: true,
            status: 'Completada'
        }))

        // 4. Merge and Sort
        const allTransactions = [...mappedInvoices, ...mappedExpenses, ...mappedIncomes]
            .sort((a, b) => {
                const dateA = new Date(a.date || 0).getTime()
                const dateB = new Date(b.date || 0).getTime()
                return dateB - dateA
            })
            .slice(0, 10)

        return NextResponse.json(allTransactions)

    } catch (error) {
        console.error("Error fetching transactions:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
