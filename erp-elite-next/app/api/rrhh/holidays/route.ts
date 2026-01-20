
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { holidays, employees, tags, users } from "@/drizzle/schema";
import { DateService } from "@/lib/date-service";
import { eq, and, desc, sql, like, or } from "drizzle-orm";
import { z } from "zod";

const holidaySchema = z.object({
    employee_id: z.coerce.number().min(1, "Employee ID is required"),
    type_id: z.preprocess((val) => val === "" ? null : val, z.coerce.number().optional().nullable()),
    start_date: z.string(),
    end_date: z.string(),
    status_id: z.preprocess((val) => val === "" ? null : val, z.coerce.number().optional().nullable()),
    approver_id: z.preprocess((val) => val === "" ? null : val, z.string().optional().nullable()),
    pending_file_ids: z.array(z.number()).optional(),
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
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const typeFilter = searchParams.get("type_filter");
        const statusFilter = searchParams.get("status_filter");
        const year = searchParams.get("year");

        const offset = (page - 1) * limit;

        const conditions = [];

        if (search) {
            conditions.push(or(
                like(employees.fullName, `%${search}%`),
                like(employees.identificationNumber, `%${search}%`)
            ));
        }

        if (typeFilter && typeFilter !== 'all') {
            conditions.push(eq(holidays.typeId, parseInt(typeFilter)));
        }

        if (statusFilter && statusFilter !== 'all') {
            conditions.push(eq(holidays.statusId, parseInt(statusFilter)));
        }

        if (year) {
            conditions.push(sql`EXTRACT(YEAR FROM ${holidays.startDate}) = ${year}`);
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Step 1: Query for IDs with joins to support filtering
        const idsQuery = db
            .select({ id: holidays.id })
            .from(holidays)
            .leftJoin(employees, eq(holidays.employeeId, employees.id))
            .where(whereClause)
            .orderBy(desc(holidays.startDate))
            .limit(limit)
            .offset(offset);

        // Count query
        const countQuery = db
            .select({ count: sql<number>`count(*)` })
            .from(holidays)
            .leftJoin(employees, eq(holidays.employeeId, employees.id))
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

            data = await db.query.holidays.findMany({
                where: inArray(holidays.id, ids),
                orderBy: [desc(holidays.startDate)],
                with: {
                    employee: true,
                    type: true,
                    status: true,
                    approver: true,
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

    } catch (error) {
        console.error("Error fetching holidays:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    let body;
    try {
        body = await req.json();
        const validated = holidaySchema.parse(body);

        const newHoliday = await db.insert(holidays).values({
            employeeId: validated.employee_id,
            typeId: validated.type_id || null,
            startDate: DateService.toDB(DateService.parseToDate(validated.start_date)),
            endDate: DateService.toDB(DateService.parseToDate(validated.end_date)),
            statusId: validated.status_id || null,
            approverId: validated.approver_id || null,
            approverId: validated.approver_id || null,
        }).returning({ id: holidays.id });

        const holidayId = newHoliday[0].id;

        // Handle files if we had any logic to link them here (typically handled via file linking action separately or we'd implement it here directly)
        // For this migration, we assume the frontend handles file uploads and links them via a separate call or we implement the linking logic here if pending_file_ids connects to files_links table.
        // Looking at the Laravel controller, it uses LinkFileAction.
        // We will assume that for now we just create the record. If file linking is needed, we'd insert into files_links.

        if (validated.pending_file_ids && validated.pending_file_ids.length > 0) {
            const { filesLinks } = await import("@/drizzle/schema");

            const fileLinks = validated.pending_file_ids.map(fileId => ({
                fileId: fileId,
                fileableId: holidayId,
                fileableType: "App\\Models\\Holiday", // Maintaining Laravel polymorphism compatibility
                // areaId might be needed if strictly following the schema, but typically derived
            }));

            // We might need to handle this carefully if duplicates exist, but simple insert should work for new records
            await db.insert(filesLinks).values(fileLinks);
        }

        return NextResponse.json({ id: holidayId, message: "Solicitud creada exitosamente" }, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error("Zod Validation Error:", JSON.stringify(error.errors, null, 2));
            console.error("Received Body:", JSON.stringify(body, null, 2));
            return new NextResponse(JSON.stringify(error.errors), { status: 400 });
        }
        console.error("Error creating holiday:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
