
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { offBoardings, employees, projects, users, tags } from "@/drizzle/schema";
import { desc, eq, like, or, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth"; // Verify this import path
import { headers } from "next/headers";
import { DateService } from "@/lib/date-service";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const statusFilter = searchParams.get("status_filter");
        const dateFrom = searchParams.get("date_from");
        const dateTo = searchParams.get("date_to");

        const offset = (page - 1) * limit;

        const conditions = [];

        if (search) {
            conditions.push(
                or(
                    like(employees.fullName, `%${search}%`),
                    like(projects.name, `%${search}%`),
                    like(offBoardings.reason, `%${search}%`)
                )
            );
        }

        if (statusFilter) {
            conditions.push(eq(offBoardings.statusId, parseInt(statusFilter)));
        }

        if (dateFrom) {
            conditions.push(sql`${offBoardings.exitDate} >= ${dateFrom}`);
        }

        if (dateTo) {
            conditions.push(sql`${offBoardings.exitDate} <= ${dateTo}`);
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Step 1: Query for IDs with joins to support filtering on related tables
        const idsQuery = db
            .select({ id: offBoardings.id })
            .from(offBoardings)
            .leftJoin(employees, eq(offBoardings.employeeId, employees.id))
            .leftJoin(projects, eq(offBoardings.projectId, projects.id))
            .leftJoin(tags, eq(offBoardings.statusId, tags.id)) // Joined for status access if needed later or consistency
            .where(whereClause)
            .orderBy(desc(offBoardings.exitDate))
            .limit(limit)
            .offset(offset);

        // Calculate total count with same filters
        const countQuery = db
            .select({ count: sql<number>`count(*)` })
            .from(offBoardings)
            .leftJoin(employees, eq(offBoardings.employeeId, employees.id))
            .leftJoin(projects, eq(offBoardings.projectId, projects.id))
            .where(whereClause);

        const [results, totalCountResult] = await Promise.all([
            idsQuery,
            countQuery
        ]);

        const ids = results.map(r => r.id);
        const total = Number(totalCountResult[0]?.count || 0);

        let data = [];
        if (ids.length > 0) {
            // Step 2: Fetch full details for the specific IDs using db.query for relation nesting
            // Note: We need to use 'inArray' for the IDs
            const { inArray } = await import("drizzle-orm");

            data = await db.query.offBoardings.findMany({
                where: inArray(offBoardings.id, ids),
                orderBy: [desc(offBoardings.exitDate)],
                with: {
                    employee: true,
                    project: true,
                    status: true,
                    responsible: true,
                },
            });

            // Re-sort data to match the order of IDs if necessary (though orderBy above helps, exact order matches needed)
            data.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
        }

        return NextResponse.json({
            data,
            meta: {
                total,
                page,
                limit,
                last_page: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching offboardings:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        // Basic validation
        if (!body.employee_id || !body.exit_date) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const newOffboarding = await db.insert(offBoardings).values({
            employeeId: body.employee_id,
            projectId: body.project_id || null,
            reason: body.reason || null,
            exitDate: DateService.toDB(DateService.parseToDate(body.exit_date)),
            statusId: body.status_id || null,
            responsibleId: body.responsible_id || null,
            createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
            updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        }).returning({ id: offBoardings.id });

        const insertId = newOffboarding[0].id;

        return NextResponse.json({ id: insertId, message: "Offboarding created successfully" }, { status: 201 });

    } catch (error) {
        console.error("Error creating offboarding:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
