
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { attendances, employees, tags } from "@/drizzle/schema";
import { DateService } from "@/lib/date-service";
import { eq, and, desc, sql, like, or, gte, lte } from "drizzle-orm";
import { z } from "zod";

const attendanceSchema = z.object({
    employee_id: z.coerce.number(),
    date: z.string(),
    check_in: z.string(),
    check_out: z.string(),
    status_id: z.preprocess((val) => val === "" ? null : val, z.coerce.number().optional().nullable()),
    modality_id: z.preprocess((val) => val === "" ? null : val, z.coerce.number().optional().nullable()),
    observations: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const view = searchParams.get("view") || "daily";

        if (view === "consolidated") {
            return await getConsolidatedData(searchParams);
        }

        return await getDailyData(searchParams);

    } catch (error) {
        console.error("Error fetching attendances:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

async function getDailyData(searchParams: URLSearchParams) {
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const employeeFilter = searchParams.get("employee_filter");
    const statusFilter = searchParams.get("status_filter");
    const modalityFilter = searchParams.get("modality_filter");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");

    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
        conditions.push(or(
            like(employees.fullName, `%${search}%`),
            like(employees.identificationNumber, `%${search}%`)
        ));
    }

    if (employeeFilter) {
        conditions.push(eq(attendances.employeeId, parseInt(employeeFilter)));
    }

    if (statusFilter && statusFilter !== 'all') {
        conditions.push(eq(attendances.statusId, parseInt(statusFilter)));
    }

    if (modalityFilter && modalityFilter !== 'all') {
        conditions.push(eq(attendances.modalityId, parseInt(modalityFilter)));
    }

    if (dateFrom) {
        conditions.push(gte(attendances.date, dateFrom));
    }

    if (dateTo) {
        conditions.push(lte(attendances.date, dateTo));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // IDs query for pagination
    const idsQuery = db
        .select({ id: attendances.id })
        .from(attendances)
        .leftJoin(employees, eq(attendances.employeeId, employees.id))
        .where(whereClause)
        .orderBy(desc(attendances.date), desc(attendances.checkIn))
        .limit(limit)
        .offset(offset);

    // Count query
    const countQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(attendances)
        .leftJoin(employees, eq(attendances.employeeId, employees.id))
        .where(whereClause);

    const [results, totalCountResult] = await Promise.all([
        idsQuery,
        countQuery
    ]);

    const ids = results.map(r => r.id);
    const total = Number(totalCountResult[0]?.count || 0);

    let data = [];
    if (ids.length > 0) {
        const { inArray } = await import("drizzle-orm");

        data = await db.query.attendances.findMany({
            where: inArray(attendances.id, ids),
            orderBy: [desc(attendances.date), desc(attendances.checkIn)],
            with: {
                employee: true,
                status: true,
                modality: true,
            }
        });

        data.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    }

    return NextResponse.json({
        data,
        meta: {
            total,
            page,
            limit,
            last_page: Math.ceil(total / limit)
        }
    });
}

async function getConsolidatedData(searchParams: URLSearchParams) {
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month

    // Fetch all attendances for the month
    const monthAttendances = await db.query.attendances.findMany({
        where: and(
            sql`EXTRACT(YEAR FROM ${attendances.date}) = ${year}`,
            sql`EXTRACT(MONTH FROM ${attendances.date}) = ${month}`
        ),
        with: {
            status: true
        }
    });

    const totalEmployeesResult = await db.select({ count: sql<number>`count(*)` }).from(employees);
    const totalEmployees = Number(totalEmployeesResult[0]?.count || 0);

    // Fetch status tags to dynamically build the columns
    // Logic similar to Laravel:
    // we need 'estado_asistencia' category. 
    // Hardcoded select or separate query?
    // Let's do separate query to simplify logic or reuse helper
    // Since we can't easily reuse controller logic, we query tags where category slug is 'estado_asistencia'
    // Assuming we can join with tag_categories
    // But typical pattern: fetch options before. 
    // Here we need them to build the structure.
    // Let's rely on frontend to know columns? No, backend sends data structure.
    // Let's just group by statusId in the loop.
    // We do need the Tag names though.
    // Simple fetch of all status tags:
    //  await db.query.tags.findMany({ where: ... })
    // For now, let's just group by ID and let frontend map IDs to names if they have options, 
    // OR return the map here.
    // Laravel sends 'statusTags' prop. We should return it or let frontend options handle it.
    // Frontend options has it.
    // But the consolidation logic needs to know which IDs to count.
    // We can just iterate over the days and count what we find.

    // Logic similar to Laravel:
    const consolidated = [];
    let currentDate = new Date(startDate);

    // Helper to format YYYY-MM-DD
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    while (currentDate <= endDate) {
        const dateStr = formatDate(currentDate);
        const dayAttendances = monthAttendances.filter(a => a.date === dateStr);

        const statusCounts: Record<number, number> = {};
        dayAttendances.forEach(a => {
            if (a.statusId) {
                statusCounts[a.statusId] = (statusCounts[a.statusId] || 0) + 1;
            }
        });

        const dayName = currentDate.toLocaleDateString('es-ES', { weekday: 'long' });
        const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
        const specialDay = isWeekend ? (currentDate.getDay() === 6 ? 'Sábado' : 'Domingo') : null;

        consolidated.push({
            date: dateStr,
            day_number: currentDate.getDate(),
            day_name: dayName.charAt(0).toUpperCase() + dayName.slice(1),
            total_employees: totalEmployees,
            status_counts: statusCounts,
            special_day: specialDay,
        });

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return NextResponse.json({
        data: consolidated,
        year,
        month
    });
}

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const validated = attendanceSchema.parse(body);

        const newAttendance = await db.insert(attendances).values({
            employeeId: validated.employee_id,
            date: DateService.toDB(DateService.parseToDate(validated.date)),
            checkIn: validated.check_in,
            checkOut: validated.check_out,
            statusId: validated.status_id || null,
            modalityId: validated.modality_id || null,
            observations: validated.observations || null,
        }).returning({ id: attendances.id });

        const attendanceId = newAttendance[0].id;

        return NextResponse.json({ id: attendanceId, message: "Asistencia registrada exitosamente" }, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.errors), { status: 400 });
        }
        console.error("Error creating attendance:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
