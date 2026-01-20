import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { contracts, employees } from "@/drizzle/schema";
import { desc, eq, and, or, like, inArray, sql } from "drizzle-orm";
import { DateService } from "@/lib/date-service";

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const statusId = searchParams.get('status_id');
    const typeId = searchParams.get('type_id');
    const categoryId = searchParams.get('category_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    try {
        const filters = [];

        if (statusId) filters.push(eq(contracts.statusId, parseInt(statusId)));
        if (typeId) filters.push(eq(contracts.typeId, parseInt(typeId)));
        if (categoryId) filters.push(eq(contracts.categoryId, parseInt(categoryId)));

        if (search) {
            const matchingEmployees = await db.select({ id: employees.id })
                .from(employees)
                .where(or(
                    like(employees.fullName, `%${search}%`),
                    like(employees.identificationNumber, `%${search}%`)
                ));

            const empIds = matchingEmployees.map(e => e.id);
            if (empIds.length > 0) {
                filters.push(inArray(contracts.employeeId, empIds));
            } else {
                return NextResponse.json({
                    data: [],
                    meta: {
                        total: 0,
                        page,
                        limit,
                        last_page: 0
                    }
                });
            }
        }

        // Get Total Count
        const totalResult = await db.select({ count: sql<number>`count(*)` })
            .from(contracts)
            .where(and(...filters));
        const total = totalResult[0].count;

        // Get Data
        const rawData = await db.query.contracts.findMany({
            where: and(...filters),
            limit,
            offset,
            orderBy: [desc(contracts.createdAt)],
            with: {
                employee: true,
                tag_typeId: true,
                tag_categoryId: true,
                tag_statusId: true
            }
        });

        const data = rawData.map(c => ({
            ...c,
            type: c.tag_typeId,
            category: c.tag_categoryId,
            status: c.tag_statusId,
            tag_typeId: undefined, // Cleanup
            tag_categoryId: undefined,
            tag_statusId: undefined
        }));

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
        console.error("Error fetching contracts:", error);
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

    try {
        const body = await req.json();

        // Basic validation
        if (!body.employee_id || !body.type_id || !body.status_id || !body.start_date) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const userId = session.user.id; // UUID string, not int

        const [result] = await db.insert(contracts).values({
            employeeId: parseInt(body.employee_id),
            typeId: parseInt(body.type_id),
            categoryId: parseInt(body.category_id),
            statusId: parseInt(body.status_id),
            startDate: DateService.toDB(DateService.parseToDate(body.start_date))!,
            endDate: body.end_date ? DateService.toDB(DateService.parseToDate(body.end_date)) : null,
            amount: body.amount || null,
            scheduleId: body.schedule_id ? parseInt(body.schedule_id) : null,
            registeredById: userId,
            createdAt: DateService.toISO(),
            updatedAt: DateService.toISO(),
        }).returning({ id: contracts.id });

        // Handle file attachments if any (would need logic like LinkFileAction)
        // For now, assuming basic create.

        return NextResponse.json({ success: true, id: result.id });

    } catch (error) {
        console.error("Error creating contract:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
