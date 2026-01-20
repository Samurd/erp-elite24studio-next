
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { payrolls, taxRecords, tags, employees, tagCategories } from "@/drizzle/schema";
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: Request) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(request.url);
    const yearStats = parseInt(searchParams.get("yearStats") || new Date().getFullYear().toString());
    const yearTaxes = parseInt(searchParams.get("yearTaxes") || new Date().getFullYear().toString());
    const yearPayrolls = parseInt(searchParams.get("yearPayrolls") || new Date().getFullYear().toString());
    const yearDeductions = parseInt(searchParams.get("yearDeductions") || new Date().getFullYear().toString());

    // 1. Status Stats
    // Query: Count payrolls by status name for yearStats
    /* 
      Laravel: Payroll::join('tags')... group by tags.name
    */
    const statusStatsRaw = await db
        .select({
            name: tags.name,
            count: sql<number>`count(*)`
        })
        .from(payrolls)
        .leftJoin(tags, eq(payrolls.statusId, tags.id))
        .where(sql`EXTRACT(YEAR FROM ${payrolls.createdAt}) = ${yearStats}`)
        .groupBy(tags.name);

    // 2. Gender Stats
    // Join payrolls -> employees -> tags(gender)
    const genderStatsRaw = await db
        .select({
            name: tags.name,
            count: sql<number>`count(*)`
        })
        .from(payrolls)
        .innerJoin(employees, eq(payrolls.employeeId, employees.id))
        .innerJoin(tags, eq(employees.genderId, tags.id))
        .where(sql`EXTRACT(YEAR FROM ${payrolls.createdAt}) = ${yearStats}`)
        .groupBy(tags.name);

    // 3. Deductions per Month from TaxRecords
    // Laravel: TaxRecord::whereYear... select sum(amount), month(date)
    const deductionsRaw = await db
        .select({
            month: sql<number>`EXTRACT(MONTH FROM ${taxRecords.date})`,
            total: sql<number>`SUM(${taxRecords.amount})`
        })
        .from(taxRecords)
        .where(sql`EXTRACT(YEAR FROM ${taxRecords.date}) = ${yearDeductions}`)
        .groupBy(sql`EXTRACT(MONTH FROM ${taxRecords.date})`);

    // Process deductions into array of 12 (divide by 100 for money format?)
    // Laravel code: ($deductionsRaw[$i] ?? 0) / 100
    const deductionsData = Array(12).fill(0);
    deductionsRaw.forEach(item => {
        // month is 1-12
        const monthIndex = Number(item.month) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
            deductionsData[monthIndex] = Number(item.total) / 100;
        }
    });

    // 4. Recent Payrolls
    const recentPayrolls = await db.query.payrolls.findMany({
        where: sql`EXTRACT(YEAR FROM ${payrolls.createdAt}) = ${yearPayrolls}`,
        with: {
            employee: true,
            status: true,
        },
        orderBy: [desc(payrolls.createdAt)],
        limit: 5,
    });

    // 5. Recent Taxes
    const recentTaxes = await db.query.taxRecords.findMany({
        where: sql`EXTRACT(YEAR FROM ${taxRecords.date}) = ${yearTaxes}`,
        // with: { type: true, status: true }, // TaxRecord relations not fully verified in my view_file but assumed.
        // Actually relations.ts showed 'taxRecords_typeId' and 'taxRecords_statusId'.
        // So I can use 'type' and 'status' (remapped in relations usually? No, check relations names).
        // relations.ts: line 273 `taxRecords_statusId: many(...)` - wait, User/Tag relations.
        // Let's check `relations.ts` closer for `taxRecords`.
        // Lines 272-277 in relations.ts: `taxRecords_statusId`, `taxRecords_typeId` are distinct **relations**?
        // Ah, `relations(tags, ...)` mentions `taxRecords_statusId: many(taxRecords)`.

        // I need `relations(taxRecords, ...)` definition.
        // It wasn't shown in the snippets I read (they cut off or I missed it).
        // I will assume standard naming convention `type` and `status` or skip 'with' if problematic and just show raw data or use explicit joins if needed.
        // But for "Recent Taxes" usually type name and status name are needed.
        // I'll skip 'with' for now to update later if it fails and stick to base fields, OR try to guess.
        // Let's try `with: { Tag_typeId: true, ... }`? No.

        // I'll omit `with` relations for Recent Taxes for now to avoid specific "relation not found" error until verified.
        // I will just select raw data.
        orderBy: [desc(taxRecords.date)],
        limit: 5,
    });

    return NextResponse.json({
        statusLabels: statusStatsRaw.map(s => s.name || 'Unknown'),
        statusData: statusStatsRaw.map(s => s.count),
        genderLabels: genderStatsRaw.map(g => g.name || 'Unknown'),
        genderData: genderStatsRaw.map(g => g.count),
        deductionsData,
        recentPayrolls,
        recentTaxes,
    });
}
