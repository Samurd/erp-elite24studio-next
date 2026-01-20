
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { kpis, kpiRecords, roles } from "@/drizzle/schema";
import { eq, desc, and, or, like, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { format } from "date-fns";
import { DateService } from "@/lib/date-service";

const kpiSchema = z.object({
    indicator_name: z.string().min(1),
    target_value: z.number().nullable().optional(),
    periodicity_days: z.number().min(1),
    role_id: z.number(),
});

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || "10"));
        const search = searchParams.get("search") || "";
        const roleFilter = searchParams.get("role_filter");
        const periodFilter = searchParams.get("period_filter");

        const offset = (page - 1) * pageSize;

        // Build WHERE clause
        let whereClause = undefined;
        const conditions = [];

        if (search) {
            conditions.push(
                or(
                    like(kpis.indicatorName, `%${search}%`),
                    like(kpis.protocolCode, `%${search}%`)
                )
            );
        }

        if (roleFilter) {
            conditions.push(eq(kpis.roleId, parseInt(roleFilter)));
        }

        if (periodFilter) {
            const now = new Date();
            let dateThreshold: Date | undefined;

            if (periodFilter === 'week') {
                dateThreshold = new Date(now.setDate(now.getDate() - 7));
            } else if (periodFilter === 'month') {
                dateThreshold = new Date(now.setDate(now.getDate() - 30));
            } else if (periodFilter === 'quarter') {
                dateThreshold = new Date(now.setDate(now.getDate() - 90));
            }

            // Logic for period filter: KPIs that have records within the period
            // This is complex in a single query with Drizzle without subqueries in where
            // For simplicity, we might filter this client side or use a more complex join query
            // However, Laravel implementation does `whereHas('records'...)`
            // We can check if we can join efficiently.
            // Or we can pre-fetch IDs.

            // For now, let's skip period filter in the main query logic for simplicity unless critical, 
            // OR implement it if feasible.
            // Actually, let's implement it by fetching IDs first if period is set.
            if (dateThreshold) {
                // This requires subquery support which is verbose, or just simple join logic.
                // Given the scope, let's ignore it for the moment or rely on client filtering if the list is small, 
                // but for pagination we need it.
                // Let's defer this specific complex filter or try to implement it via checking `exists`.
                // Simpler approach: Join kpiRecords and filter.
                // But that duplicates rows.
                // Let's just create a subquery logic if possible, or simpler:
                // `kpis.id` in (select `kpi_id` from `kpi_records` where `record_date` >= date)
                // Drizzle:
                const subQuery = db.select({ kpiId: kpiRecords.kpiId })
                    .from(kpiRecords)
                    .where(gte(kpiRecords.recordDate, DateService.toDB(dateThreshold)));

                conditions.push(sql`${kpis.id} IN ${subQuery}`);
            }
        }

        if (conditions.length > 0) {
            whereClause = and(...conditions);
        }

        // Main Query
        const data = await db.query.kpis.findMany({
            where: whereClause,
            limit: pageSize,
            offset: offset,
            orderBy: [desc(kpis.createdAt)],
            with: {
                role: true,
                kpiRecords: {
                    orderBy: [desc(kpiRecords.recordDate)],
                    limit: 1, // Get latest record
                },
            },
        });

        // Total Count
        // const totalResult = await db.select({ count: sql<number>`count(*)` }).from(kpis).where(whereClause);
        // const total = totalResult[0].count;
        // Optimization: separate count query
        const totalResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(kpis)
            .where(whereClause);
        const total = Number(totalResult[0]?.count || 0);

        return NextResponse.json({
            data,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        });
    } catch (error) {
        console.error("Error fetching KPIs:", error);
        return NextResponse.json(
            { error: "Error fetching KPIs" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validatedData = kpiSchema.parse(body);

        // Generate Protocol Code
        // Get last KPI ID to increment
        const lastKpi = await db.query.kpis.findFirst({
            orderBy: [desc(kpis.id)]
        });

        const nextId = (lastKpi?.id || 0) + 1;
        const protocolCode = `KPI-${String(nextId).padStart(3, '0')}`;

        const newKpi = await db.insert(kpis).values({
            indicatorName: validatedData.indicator_name,
            periodicityDays: validatedData.periodicity_days,
            roleId: validatedData.role_id,
            protocolCode,
            targetValue: validatedData.target_value ? Number(validatedData.target_value) : null,
            createdAt: DateService.toISO(),
            updatedAt: DateService.toISO(),
        }).returning({ id: kpis.id });

        return NextResponse.json({ success: true, id: newKpi[0].id });

    } catch (error) {
        console.error("Error creating KPI:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
        }
        return NextResponse.json(
            { error: "Error creating KPI" },
            { status: 500 }
        );
    }
}
