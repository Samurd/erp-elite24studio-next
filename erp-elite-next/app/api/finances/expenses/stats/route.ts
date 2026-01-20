import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { expenses, tags, tagCategories, users } from "@/drizzle/schema";
import { desc, sql, eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const yearChart1 = searchParams.get("yearChart1") || new Date().getFullYear().toString();
        const monthChart2 = searchParams.get("monthChart2") || (new Date().getMonth() + 1).toString();
        const yearTable = searchParams.get("yearTable") || new Date().getFullYear().toString();

        // 1. Totals (Direct, Indirect, Taxes, Finance)
        // Helper to get sum by category name
        const getSumByCategoryName = async (categoryName: string) => {
            const result = await db.select({
                total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`
            })
                .from(expenses)
                .innerJoin(tags, eq(expenses.categoryId, tags.id))
                .where(eq(tags.name, categoryName));

            return Number(result[0].total); // Returns cents
        };

        const [totalDirect, totalIndirect, totalTaxes, totalFinance] = await Promise.all([
            getSumByCategoryName("Costos Directos"),
            getSumByCategoryName("Gastos Indirectos"),
            getSumByCategoryName("Impuestos"),
            getSumByCategoryName("Gastos Financieros")
        ]);

        const totals = {
            totalDirect,
            totalIndirect,
            totalTaxes,
            totalFinance
        };

        // 2. Chart 1: Expenses by Month
        const expensesByMonthData = await db.select({
            month: sql<number>`EXTRACT(MONTH FROM ${expenses.date})`,
            amount: sql<number>`SUM(${expenses.amount})`
        })
            .from(expenses)
            .where(sql`EXTRACT(YEAR FROM ${expenses.date}) = ${yearChart1}`)
            .groupBy(sql`EXTRACT(MONTH FROM ${expenses.date})`);

        const expenseByMonth: Record<number, number> = {};
        expensesByMonthData.forEach(item => {
            // Divide by 100 for display units (as per Laravel logic)
            expenseByMonth[item.month] = Number(item.amount) / 100;
        });
        // Fill missing months
        for (let i = 1; i <= 12; i++) {
            if (!expenseByMonth[i]) expenseByMonth[i] = 0;
        }

        // 3. Chart 2: Expenses by Category for Month
        const expensesByMonthCategory = await db.query.expenses.findMany({
            where: and(
                sql`EXTRACT(YEAR FROM ${expenses.date}) = ${yearChart1}`,
                sql`EXTRACT(MONTH FROM ${expenses.date}) = ${monthChart2}`
            ),
            with: {
                tag_categoryId: true
            }
        });

        const categoryMap = new Map<string, number>();
        expensesByMonthCategory.forEach(exp => {
            if (exp.tag_categoryId && exp.amount) {
                const catName = exp.tag_categoryId.name;
                const current = categoryMap.get(catName) || 0;
                categoryMap.set(catName, current + (Number(exp.amount) / 100)); // Units
            }
        });

        const sortedCategories = Array.from(categoryMap.entries()).sort((a, b) => b[1] - a[1]);
        const expenseByCategoryLabels = sortedCategories.map(e => e[0]);
        const expenseByCategoryData = sortedCategories.map(e => e[1]);

        // 4. Top 5 Expenses
        const topProjectsData = await db.query.expenses.findMany({
            where: sql`EXTRACT(YEAR FROM ${expenses.date}) = ${yearTable}`,
            orderBy: [desc(expenses.amount)],
            limit: 5,
            with: {
                tag_categoryId: true,
                user: true
            }
        });

        const topProjects = topProjectsData.map(item => ({
            ...item,
            category: item.tag_categoryId,
            createdBy: item.user
        }));

        return NextResponse.json({
            totals,
            expenseByMonth,
            expenseByCategoryLabels,
            expenseByCategoryData,
            topProjects
        });

    } catch (error: any) {
        console.error("Error fetching expense stats:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
