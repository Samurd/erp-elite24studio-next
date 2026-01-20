import { db } from "@/lib/db";
import { incomes, tags } from "@/drizzle/schema";
import { and, eq, sql, desc, gte, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { format, subYears, subMonths, startOfMonth, endOfMonth, getYear, getMonth } from "date-fns";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    // Global filters
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : null;

    // Independent chart filters
    const monthlyChartYear = parseInt(searchParams.get("monthlyChartYear") || new Date().getFullYear().toString());
    const categoryChartMonth = searchParams.get("categoryChartMonth") ? parseInt(searchParams.get("categoryChartMonth")!) : (new Date().getMonth() + 1); // JS month is 0-indexed
    const comparisonChartYear = parseInt(searchParams.get("comparisonChartYear") || new Date().getFullYear().toString());

    try {
        // ------------------------------------------------------------------
        // 1. KPI Cards & Growth (Uses Global year and month)
        // ------------------------------------------------------------------
        const globalConditions = [
            sql`EXTRACT(YEAR FROM ${incomes.date}) = ${year}`
        ];
        if (month) {
            globalConditions.push(sql`EXTRACT(MONTH FROM ${incomes.date}) = ${month}`);
        }

        const globalIncomesData = await db.query.incomes.findMany({
            where: and(...globalConditions),
            with: {
                tag_typeId: true,
                tag_categoryId: true,
            }
        });

        const totalIncome = globalIncomesData.reduce((sum, item) => sum + Number(item.amount), 0);

        // Income by Type (Areas)
        const incomeByTypeRaw: Record<string, number> = {};
        globalIncomesData.forEach(item => {
            const typeName = item.tag_typeId?.name || 'Sin Tipo';
            incomeByTypeRaw[typeName] = (incomeByTypeRaw[typeName] || 0) + Number(item.amount);
        });

        // Convert to display units (divide by 100)
        const incomeByType: Record<string, number> = {};
        for (const [key, value] of Object.entries(incomeByTypeRaw)) {
            incomeByType[key] = value / 100;
        }

        // Growth Percentage
        let previousPeriodIncome = 0;
        if (month) {
            // Compare with previous month
            // Note: month is 1-indexed here. 
            // If month is 1 (Jan), prev is Dec of year-1.
            let prevMonth = month - 1;
            let prevYear = year;
            if (prevMonth === 0) {
                prevMonth = 12;
                prevYear = year - 1;
            }

            const prevPeriodData = await db.select({
                amount: incomes.amount
            }).from(incomes)
                .where(and(
                    sql`EXTRACT(YEAR FROM ${incomes.date}) = ${prevYear}`,
                    sql`EXTRACT(MONTH FROM ${incomes.date}) = ${prevMonth}`
                ));

            previousPeriodIncome = prevPeriodData.reduce((sum, item) => sum + Number(item.amount), 0);

        } else {
            // Compare with previous year
            const prevYear = year - 1;
            const prevPeriodData = await db.select({
                amount: incomes.amount
            }).from(incomes)
                .where(sql`EXTRACT(YEAR FROM ${incomes.date}) = ${prevYear}`);

            previousPeriodIncome = prevPeriodData.reduce((sum, item) => sum + Number(item.amount), 0);
        }

        let growthPercentage = 0;
        if (previousPeriodIncome > 0) {
            growthPercentage = ((totalIncome - previousPeriodIncome) / previousPeriodIncome) * 100;
        }


        // ------------------------------------------------------------------
        // 2. Net Income by Month (Bar Chart) - Uses monthlyChartYear
        // ------------------------------------------------------------------
        const monthlyIncomesData = await db.select({
            date: incomes.date,
            amount: incomes.amount
        }).from(incomes)
            .where(sql`EXTRACT(YEAR FROM ${incomes.date}) = ${monthlyChartYear}`);

        const monthlyChartData = Array(12).fill(0);
        monthlyIncomesData.forEach(item => {
            const m = parseInt(item.date.split('-')[1]) - 1; // 0-indexed month
            if (m >= 0 && m < 12) {
                monthlyChartData[m] += Number(item.amount) / 100;
            }
        });


        // ------------------------------------------------------------------
        // 3. Net Income by Category (Bar Chart) - Uses categoryChartMonth and Global Year
        // ------------------------------------------------------------------
        // Note: The Laravel code uses Global $year for this, effectively combining year + selected month
        const categoryConditions = [
            sql`EXTRACT(YEAR FROM ${incomes.date}) = ${year}`
        ];
        if (categoryChartMonth) {
            categoryConditions.push(sql`EXTRACT(MONTH FROM ${incomes.date}) = ${categoryChartMonth}`);
        }

        const categoryIncomesData = await db.query.incomes.findMany({
            where: and(...categoryConditions),
            with: {
                tag_categoryId: true,
            }
        });

        const incomeByCategory: Record<string, number> = {};
        categoryIncomesData.forEach(item => {
            const catName = item.tag_categoryId?.name || 'Sin Categoría';
            incomeByCategory[catName] = (incomeByCategory[catName] || 0) + Number(item.amount);
        });

        // Sort descending
        const sortedCategories = Object.entries(incomeByCategory)
            .sort(([, a], [, b]) => b - a)
            .reduce((r, [k, v]) => ({ ...r, [k]: v / 100 }), {}); // Divide by 100

        const chartCategoryLabels = Object.keys(sortedCategories);
        const chartCategoryData = Object.values(sortedCategories);


        // ------------------------------------------------------------------
        // 4. Net Income by Area (Donut Chart) - Uses Global Filters
        // ------------------------------------------------------------------
        // Already calculated as incomeByType
        const chartAreaLabels = Object.keys(incomeByType);
        const chartAreaData = Object.values(incomeByType);


        // ------------------------------------------------------------------
        // 5. Comparison (Year vs Year) - Uses comparisonChartYear vs Previous
        // ------------------------------------------------------------------
        const compCurrentData = await db.select({
            date: incomes.date,
            amount: incomes.amount
        }).from(incomes)
            .where(sql`EXTRACT(YEAR FROM ${incomes.date}) = ${comparisonChartYear}`);

        const compLastData = await db.select({
            date: incomes.date,
            amount: incomes.amount
        }).from(incomes)
            .where(sql`EXTRACT(YEAR FROM ${incomes.date}) = ${comparisonChartYear - 1}`);

        const chartComparisonCurrent = Array(12).fill(0);
        compCurrentData.forEach(item => {
            const m = parseInt(item.date.split('-')[1]) - 1;
            if (m >= 0 && m < 12) chartComparisonCurrent[m] += Number(item.amount) / 100;
        });

        const chartComparisonLast = Array(12).fill(0);
        compLastData.forEach(item => {
            const m = parseInt(item.date.split('-')[1]) - 1;
            if (m >= 0 && m < 12) chartComparisonLast[m] += Number(item.amount) / 100;
        });


        // ------------------------------------------------------------------
        // 6. Stacked Bar: Category by Month - Uses Global Year
        // ------------------------------------------------------------------
        // We reuse globalIncomesData filtered by Global Year (but we need ensure if month is selected globally we ignore it? 
        // Laravel code: $stackedIncomes = $globalIncomes; <- This implies it respects GLOBAL filters.
        // If user selects specific month globally, this chart shows only 1 month bar?
        // Let's verify Laravel logic: "$globalQuery = Income::query()->whereYear... if month..."
        // Yes, if Month is selected, globalIncomes only has that month.

        // HOWEVER, "Category by Month" usually implies showing trend over the year.
        // Let's look closer at Laravel line 121: $stackedIncomes = $globalIncomes;
        // And lines 43-46 apply month filter if present.
        // So yes, if month is selected, the stacked chart only shows data for that month.

        // Get all categories specifically for 'categoria_ingreso' to establish the stacks
        // We need to fetch tags.
        // Ideally we just group existing data, but to match colors/labels exactly we might want to iterate known categories.
        // For efficiency, let's just group the data we have.

        const stackedGroups: Record<string, number[]> = {};

        // We need the list of categories involved. 
        const categoryNames = new Set<string>();
        globalIncomesData.forEach(item => {
            if (item.tag_categoryId?.name) categoryNames.add(item.tag_categoryId.name);
        });

        // Helper for colors
        const getColorForCategory = (name: string) => {
            const colors: Record<string, string> = {
                'LEED y EDGE': '#818cf8',
                'Diseño Arq.Ejecutivo': '#c084fc',
                'Interiorismo': '#f472b6',
                'Inmobiliaria': '#fb7185',
                'Ejecucion de obra': '#38bdf8',
                'Arquitectura espacial': '#2dd4bf',
            };
            return colors[name] ?? '#94a3b8';
        };

        const stackedChartData = [];
        for (const catName of Array.from(categoryNames)) {
            const data = Array(12).fill(0);

            globalIncomesData.forEach(item => {
                if (item.tag_categoryId?.name === catName) {
                    const m = parseInt(item.date.split('-')[1]) - 1;
                    if (m >= 0 && m < 12) {
                        data[m] += Number(item.amount) / 100;
                    }
                }
            });

            if (data.reduce((a, b) => a + b, 0) > 0) {
                stackedChartData.push({
                    label: catName,
                    data: data,
                    backgroundColor: getColorForCategory(catName),
                });
            }
        }

        return NextResponse.json({
            totalIncome: totalIncome / 100,
            incomeByType: incomeByType, // already /100
            growthPercentage: growthPercentage,
            previousPeriodIncome: previousPeriodIncome / 100,
            chartMonthlyData: monthlyChartData,
            chartCategoryLabels: chartCategoryLabels,
            chartCategoryData: chartCategoryData,
            chartAreaLabels: chartAreaLabels,
            chartAreaData: chartAreaData,
            chartComparisonCurrent: chartComparisonCurrent,
            chartComparisonLast: chartComparisonLast,
            stackedChartData: stackedChartData,
        });

    } catch (error) {
        console.error("Error fetching net stats:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
