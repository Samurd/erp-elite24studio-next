import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { incomes, tags } from "@/drizzle/schema";
import { and, desc, eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const yearChart1 = parseInt(searchParams.get("yearChart1") || new Date().getFullYear().toString());
    const monthChart2 = parseInt(searchParams.get("monthChart2") || (new Date().getMonth() + 1).toString());
    const yearTable = parseInt(searchParams.get("yearTable") || new Date().getFullYear().toString());

    try {
        // Chart 1: Gross by month
        // In Laravel: Income::whereYear("date", $yearChart1)->get() -> calculate sum per month
        // We can do this with aggregation in SQL or fetch and process. SQL is better but let's emulate logic.
        const incomesByYear = await db.select({
            date: incomes.date,
            amount: incomes.amount
        })
            .from(incomes)
            .where(sql`EXTRACT(YEAR FROM ${incomes.date}) = ${yearChart1}`);

        // Process for Chart 1
        const grossByMonth = Array(12).fill(0);
        incomesByYear.forEach(inc => {
            if (inc.date && inc.amount) {
                const month = new Date(inc.date).getMonth(); // 0-11
                grossByMonth[month] += Number(inc.amount) / 100; // Amount is stored as integer cents likely
            }
        });

        // Chart 2: Gross by category for selected month
        // In Laravel: Income::with("category")->whereMonth("date", $monthChart2)->whereYear("date", $yearChart1)->get()
        const incomesByMonthCategory = await db.query.incomes.findMany({
            where: and(
                sql`EXTRACT(YEAR FROM ${incomes.date}) = ${yearChart1}`,
                sql`EXTRACT(MONTH FROM ${incomes.date}) = ${monthChart2}`
            ),
            with: {
                tag_categoryId: true
            }
        });

        const categoryMap = new Map<string, number>();
        incomesByMonthCategory.forEach(inc => {
            if (inc.tag_categoryId && inc.amount) {
                const catName = inc.tag_categoryId.name;
                const current = categoryMap.get(catName) || 0;
                categoryMap.set(catName, current + (Number(inc.amount) / 100));
            }
        });

        // Sort by value desc
        const sortedCategories = Array.from(categoryMap.entries()).sort((a, b) => b[1] - a[1]);
        const grossByCategoryLabels = sortedCategories.map(e => e[0]);
        const grossByCategoryData = sortedCategories.map(e => e[1]);

        // Top 5 incomes
        // In Laravel: Income::whereYear("date", $yearTable)->orderByDesc("amount")->limit(5)
        const topProjectsData = await db.query.incomes.findMany({
            where: sql`EXTRACT(YEAR FROM ${incomes.date}) = ${yearTable}`,
            orderBy: [desc(incomes.amount)],
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
            grossByMonth,
            grossByCategoryLabels,
            grossByCategoryData,
            topProjects
        });

    } catch (error: any) {
        console.error("Error fetching gross income stats:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
