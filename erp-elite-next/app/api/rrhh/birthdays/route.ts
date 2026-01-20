import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { birthdays, employees, contacts, users } from "@/drizzle/schema";
import { desc, eq, and, like, or, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DateService } from "@/lib/date-service";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search");
        const typeFilter = searchParams.get("typeFilter");
        const monthFilter = searchParams.get("monthFilter");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");

        const whereConditions = [];

        // Filter by type
        if (typeFilter) {
            if (typeFilter === "employee") {
                whereConditions.push(sql`${birthdays.employeeId} IS NOT NULL`);
            } else if (typeFilter === "contact") {
                whereConditions.push(sql`${birthdays.contactId} IS NOT NULL`);
            }
        }

        // Filter by month
        if (monthFilter && monthFilter !== "all") {
            whereConditions.push(sql`MONTH(${birthdays.date}) = ${parseInt(monthFilter)}`);
        }

        const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

        // Get all data with relations first, then filter by search in memory
        let allData = await db.query.birthdays.findMany({
            where: whereClause,
            with: {
                employee: true,
                contact: true,
                responsible: true,
            },
            orderBy: [desc(birthdays.date)],
        });

        // Apply search filter in memory
        if (search) {
            const searchLower = search.toLowerCase();
            allData = allData.filter(birthday => {
                const employeeName = birthday.employee?.fullName?.toLowerCase() || '';
                const contactName = birthday.contact?.name?.toLowerCase() || '';
                return employeeName.includes(searchLower) || contactName.includes(searchLower);
            });
        }

        const total = allData.length;
        const totalPages = Math.ceil(total / limit);

        // Apply pagination
        const data = allData.slice((page - 1) * limit, page * limit);

        return NextResponse.json({
            data,
            total,
            page,
            limit,
            totalPages
        });
    } catch (error) {
        console.error("Error fetching birthdays:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        const body = await request.json();

        // Basic validation
        if (!body.date) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        if (body.is_employee && !body.employee_id) {
            return new NextResponse("Employee ID is required", { status: 400 });
        }

        if (!body.is_employee && !body.contact_id) {
            return new NextResponse("Contact ID is required", { status: 400 });
        }

        // Verify the user exists in the database
        // Verify the user exists in the database
        const userId = session.user.id;
        const userExists = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        const result = await db.insert(birthdays).values({
            employeeId: body.is_employee ? parseInt(body.employee_id) : null,
            contactId: !body.is_employee ? parseInt(body.contact_id) : null,
            date: DateService.toDB(DateService.parseToDate(body.date))!,
            whatsapp: body.whatsapp || null,
            comments: body.comments || null,
            responsibleId: body.responsible_id || (userExists ? userId : null),
        });

        // Get the inserted ID from the result
        const insertId = result[0]?.insertId || result.insertId;

        return NextResponse.json({ id: insertId, success: true });
    } catch (error) {
        console.error("Error creating birthday:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
