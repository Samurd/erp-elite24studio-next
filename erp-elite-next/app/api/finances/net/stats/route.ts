import { db } from "@/lib/db";
import { incomes, tags, expenses, payrolls, taxRecords } from "@/drizzle/schema";
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

        const totalGrossIncome = globalIncomesData.reduce((sum, item) => sum + Number(item.amount), 0);

        // Fetch Global Expenses
        const globalExpensesConditions = [
            sql`EXTRACT(YEAR FROM ${expenses.date}) = ${year}`
        ];
        if (month) globalExpensesConditions.push(sql`EXTRACT(MONTH FROM ${expenses.date}) = ${month}`);
        const globalExpensesData = await db.select({ amount: expenses.amount }).from(expenses).where(and(...globalExpensesConditions));
        const totalExpenses = globalExpensesData.reduce((sum, item) => sum + Number(item.amount), 0);

        // Fetch Global Payrolls
        const globalPayrollsConditions = [
            sql`EXTRACT(YEAR FROM ${payrolls.createdAt}) = ${year}`
        ];
        if (month) globalPayrollsConditions.push(sql`EXTRACT(MONTH FROM ${payrolls.createdAt}) = ${month}`);
        const globalPayrollsData = await db.select({ total: payrolls.total }).from(payrolls).where(and(...globalPayrollsConditions));
        const totalPayrolls = globalPayrollsData.reduce((sum, item) => sum + Number(item.total), 0);

        // Fetch Global Taxes
        const globalTaxesConditions = [
            sql`EXTRACT(YEAR FROM ${taxRecords.date}) = ${year}`
        ];
        if (month) globalTaxesConditions.push(sql`EXTRACT(MONTH FROM ${taxRecords.date}) = ${month}`);
        const globalTaxesData = await db.select({ amount: taxRecords.amount }).from(taxRecords).where(and(...globalTaxesConditions));
        const totalTaxes = globalTaxesData.reduce((sum, item) => sum + Number(item.amount), 0);

        const totalIncome = totalGrossIncome - totalExpenses - totalPayrolls - totalTaxes;

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
            let prevMonth = month - 1;
            let prevYear = year;
            if (prevMonth === 0) {
                prevMonth = 12;
                prevYear = year - 1;
            }

            const prevIncomes = await db.select({ amount: incomes.amount }).from(incomes).where(and(sql`EXTRACT(YEAR FROM ${incomes.date}) = ${prevYear}`, sql`EXTRACT(MONTH FROM ${incomes.date}) = ${prevMonth}`));
            const prevExp = await db.select({ amount: expenses.amount }).from(expenses).where(and(sql`EXTRACT(YEAR FROM ${expenses.date}) = ${prevYear}`, sql`EXTRACT(MONTH FROM ${expenses.date}) = ${prevMonth}`));
            const prevPay = await db.select({ total: payrolls.total }).from(payrolls).where(and(sql`EXTRACT(YEAR FROM ${payrolls.createdAt}) = ${prevYear}`, sql`EXTRACT(MONTH FROM ${payrolls.createdAt}) = ${prevMonth}`));
            const prevTax = await db.select({ amount: taxRecords.amount }).from(taxRecords).where(and(sql`EXTRACT(YEAR FROM ${taxRecords.date}) = ${prevYear}`, sql`EXTRACT(MONTH FROM ${taxRecords.date}) = ${prevMonth}`));

            const pi = prevIncomes.reduce((s, i) => s + Number(i.amount), 0);
            const pe = prevExp.reduce((s, i) => s + Number(i.amount), 0);
            const pp = prevPay.reduce((s, i) => s + Number(i.total), 0);
            const pt = prevTax.reduce((s, i) => s + Number(i.amount), 0);
            previousPeriodIncome = pi - pe - pp - pt;

        } else {
            // Compare with previous year
            const prevYear = year - 1;

            const prevIncomes = await db.select({ amount: incomes.amount }).from(incomes).where(sql`EXTRACT(YEAR FROM ${incomes.date}) = ${prevYear}`);
            const prevExp = await db.select({ amount: expenses.amount }).from(expenses).where(sql`EXTRACT(YEAR FROM ${expenses.date}) = ${prevYear}`);
            const prevPay = await db.select({ total: payrolls.total }).from(payrolls).where(sql`EXTRACT(YEAR FROM ${payrolls.createdAt}) = ${prevYear}`);
            const prevTax = await db.select({ amount: taxRecords.amount }).from(taxRecords).where(sql`EXTRACT(YEAR FROM ${taxRecords.date}) = ${prevYear}`);

            const pi = prevIncomes.reduce((s, i) => s + Number(i.amount), 0);
            const pe = prevExp.reduce((s, i) => s + Number(i.amount), 0);
            const pp = prevPay.reduce((s, i) => s + Number(i.total), 0);
            const pt = prevTax.reduce((s, i) => s + Number(i.amount), 0);
            previousPeriodIncome = pi - pe - pp - pt;
        }

        let growthPercentage = 0;
        if (previousPeriodIncome !== 0) { // Check not 0 to avoid Infinity
            growthPercentage = ((totalIncome - previousPeriodIncome) / Math.abs(previousPeriodIncome)) * 100;
        }


        // ------------------------------------------------------------------
        // 2. Net Income by Month (Bar Chart) - Uses monthlyChartYear
        // ------------------------------------------------------------------
        const monthlyIncomesData = await db.select({ date: incomes.date, amount: incomes.amount }).from(incomes).where(sql`EXTRACT(YEAR FROM ${incomes.date}) = ${monthlyChartYear}`);
        const monthlyExpensesData = await db.select({ date: expenses.date, amount: expenses.amount }).from(expenses).where(sql`EXTRACT(YEAR FROM ${expenses.date}) = ${monthlyChartYear}`);
        const monthlyPayrollsData = await db.select({ date: payrolls.createdAt, total: payrolls.total }).from(payrolls).where(sql`EXTRACT(YEAR FROM ${payrolls.createdAt}) = ${monthlyChartYear}`);
        const monthlyTaxesData = await db.select({ date: taxRecords.date, amount: taxRecords.amount }).from(taxRecords).where(sql`EXTRACT(YEAR FROM ${taxRecords.date}) = ${monthlyChartYear}`);

        const monthlyChartData = Array(12).fill(0);

        // Add Incomes
        monthlyIncomesData.forEach(item => {
            const m = parseInt(item.date.split('-')[1]) - 1;
            if (m >= 0 && m < 12) monthlyChartData[m] += Number(item.amount) / 100;
        });

        // Subtract Expenses
        monthlyExpensesData.forEach(item => {
            const m = parseInt(item.date.split('-')[1]) - 1;
            if (m >= 0 && m < 12) monthlyChartData[m] -= Number(item.amount) / 100;
        });

        // Subtract Payrolls (using createdAt as date proxy)
        monthlyPayrollsData.forEach(item => {
            if (item.date) {
                const m = parseInt(item.date.split('-')[1]) - 1;
                if (m >= 0 && m < 12) monthlyChartData[m] -= Number(item.total) / 100;
            }
        });

        // Subtract Taxes
        monthlyTaxesData.forEach(item => {
            const m = parseInt(item.date.split('-')[1]) - 1;
            if (m >= 0 && m < 12) monthlyChartData[m] -= Number(item.amount) / 100;
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
        // Current Year Net
        const compCurrentIncomes = await db.select({ date: incomes.date, amount: incomes.amount }).from(incomes).where(sql`EXTRACT(YEAR FROM ${incomes.date}) = ${comparisonChartYear}`);
        const compCurrentExp = await db.select({ date: expenses.date, amount: expenses.amount }).from(expenses).where(sql`EXTRACT(YEAR FROM ${expenses.date}) = ${comparisonChartYear}`);
        const compCurrentPay = await db.select({ date: payrolls.createdAt, total: payrolls.total }).from(payrolls).where(sql`EXTRACT(YEAR FROM ${payrolls.createdAt}) = ${comparisonChartYear}`);
        const compCurrentTax = await db.select({ date: taxRecords.date, amount: taxRecords.amount }).from(taxRecords).where(sql`EXTRACT(YEAR FROM ${taxRecords.date}) = ${comparisonChartYear}`);

        const chartComparisonCurrent = Array(12).fill(0);

        compCurrentIncomes.forEach(item => {
            const m = parseInt(item.date.split('-')[1]) - 1;
            if (m >= 0 && m < 12) chartComparisonCurrent[m] += Number(item.amount) / 100;
        });
        compCurrentExp.forEach(item => {
            const m = parseInt(item.date.split('-')[1]) - 1;
            if (m >= 0 && m < 12) chartComparisonCurrent[m] -= Number(item.amount) / 100;
        });
        compCurrentPay.forEach(item => {
            if (item.date) {
                const m = parseInt(item.date.split('-')[1]) - 1;
                if (m >= 0 && m < 12) chartComparisonCurrent[m] -= Number(item.total) / 100;
            }
        });
        compCurrentTax.forEach(item => {
            const m = parseInt(item.date.split('-')[1]) - 1;
            if (m >= 0 && m < 12) chartComparisonCurrent[m] -= Number(item.amount) / 100;
        });


        // Previous Year Net
        const prevYearComp = comparisonChartYear - 1;
        const compLastIncomes = await db.select({ date: incomes.date, amount: incomes.amount }).from(incomes).where(sql`EXTRACT(YEAR FROM ${incomes.date}) = ${prevYearComp}`);
        const compLastExp = await db.select({ date: expenses.date, amount: expenses.amount }).from(expenses).where(sql`EXTRACT(YEAR FROM ${expenses.date}) = ${prevYearComp}`);
        const compLastPay = await db.select({ date: payrolls.createdAt, total: payrolls.total }).from(payrolls).where(sql`EXTRACT(YEAR FROM ${payrolls.createdAt}) = ${prevYearComp}`);
        const compLastTax = await db.select({ date: taxRecords.date, amount: taxRecords.amount }).from(taxRecords).where(sql`EXTRACT(YEAR FROM ${taxRecords.date}) = ${prevYearComp}`);

        const chartComparisonLast = Array(12).fill(0);

        compLastIncomes.forEach(item => {
            const m = parseInt(item.date.split('-')[1]) - 1;
            if (m >= 0 && m < 12) chartComparisonLast[m] += Number(item.amount) / 100;
        });
        compLastExp.forEach(item => {
            const m = parseInt(item.date.split('-')[1]) - 1;
            if (m >= 0 && m < 12) chartComparisonLast[m] -= Number(item.amount) / 100;
        });
        compLastPay.forEach(item => {
            if (item.date) {
                const m = parseInt(item.date.split('-')[1]) - 1;
                if (m >= 0 && m < 12) chartComparisonLast[m] -= Number(item.total) / 100;
            }
        });
        compLastTax.forEach(item => {
            const m = parseInt(item.date.split('-')[1]) - 1;
            if (m >= 0 && m < 12) chartComparisonLast[m] -= Number(item.amount) / 100;
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
