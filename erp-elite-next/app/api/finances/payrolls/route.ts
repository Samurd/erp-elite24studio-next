
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { payrolls, employees, tags, tagCategories, filesLinks } from "@/drizzle/schema";
import { eq, like, desc, and, gte, lte, sql, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { attachFileToModel, getFilesForModel } from "@/actions/files";

export async function GET(request: Request) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const statusFilter = searchParams.get("status_filter");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "10");

    const offset = (page - 1) * perPage;

    // Base conditions
    let conditions = [];

    if (search) {
        conditions.push(like(employees.fullName, `%${search}%`));
    }

    if (statusFilter) {
        conditions.push(eq(payrolls.statusId, parseInt(statusFilter)));
    }

    if (dateFrom) {
        conditions.push(gte(sql`DATE(${payrolls.createdAt})`, dateFrom));
    }

    if (dateTo) {
        conditions.push(lte(sql`DATE(${payrolls.createdAt})`, dateTo));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Use db.select with joins to support filtering by derived tables (employees)
    const rawData = await db
        .select({
            payroll: payrolls,
            employee: employees,
            status: tags
        })
        .from(payrolls)
        .leftJoin(employees, eq(payrolls.employeeId, employees.id))
        .leftJoin(tags, eq(payrolls.statusId, tags.id))
        .where(whereClause)
        .orderBy(desc(payrolls.createdAt))
        .limit(perPage)
        .offset(offset);

    const data = rawData.map(row => ({
        ...row.payroll,
        employee: row.employee,
        status: row.status
    }));

    // Total count query
    // Always join to ensure consistent filtering
    const resCount = await db
        .select({ count: count() })
        .from(payrolls)
        .leftJoin(employees, eq(payrolls.employeeId, employees.id))
        .where(whereClause);

    const totalCount = resCount[0].count;

    return NextResponse.json({
        data,
        meta: {
            current_page: page,
            last_page: Math.ceil(totalCount / perPage),
            total: totalCount,
            per_page: perPage,
        },
    });
}

export async function POST(request: Request) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    // Use JSON only
    let payload;
    try {
        payload = await request.json();
    } catch (e) {
        return new NextResponse("Invalid JSON", { status: 400 });
    }

    try {
        const {
            employee_id,
            subtotal,
            bonos,
            deductions,
            total,
            status_id,
            observations,
            pending_file_ids,
        } = payload;

        // Validation allowing 0
        if (subtotal === undefined || subtotal === null || total === undefined || total === null) {
            return new NextResponse("Missing required fields: subtotal or total", { status: 400 });
        }

        const subtotalNum = parseInt(subtotal);
        const totalNum = parseInt(total);

        if (isNaN(subtotalNum) || isNaN(totalNum)) {
            return new NextResponse("Invalid number format for subtotal or total", { status: 400 });
        }

        // Insert
        const [newPayroll] = await db.insert(payrolls).values({
            employeeId: employee_id ? parseInt(employee_id) : null,
            subtotal: subtotalNum,
            bonos: bonos ? parseInt(bonos) : 0,
            deductions: deductions ? parseInt(deductions) : 0,
            total: totalNum,
            statusId: status_id ? parseInt(status_id) : null,
            observations: observations || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }).returning();

        // Attach files
        if (pending_file_ids && Array.isArray(pending_file_ids)) {
            for (const fileId of pending_file_ids) {
                await attachFileToModel(
                    typeof fileId === 'string' ? parseInt(fileId) : fileId,
                    "App\\Models\\Payroll",
                    newPayroll.id
                );
            }
        }

        return NextResponse.json(newPayroll);
    } catch (error: any) {
        console.error("Error creating payroll:", error);
        return new NextResponse(error.message || "Internal Server Error", { status: 500 });
    }
}
