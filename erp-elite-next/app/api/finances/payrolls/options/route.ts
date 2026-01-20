
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { employees, tags, tagCategories } from "@/drizzle/schema";
import { eq, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: Request) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    // 1. Employees (Active? Table doesn't allow filtering for active easily without a column check. 
    // Laravel: Employee::active()... Schema has 'deleted_at'? No. 'status'? No.
    // Assuming all for now or logic from schema: employees has 'departmentId' etc.
    // Let's just fetch all ordered by fullName.
    const employeesList = await db.query.employees.findMany({
        orderBy: [asc(employees.fullName)],
        columns: {
            id: true,
            fullName: true,
        }
    });

    // 2. Status Options (Category 'estado_nomina')
    // First find category
    const category = await db.query.tagCategories.findFirst({
        where: eq(tagCategories.slug, "estado_nomina"),
    });

    let statusOptions: any[] = [];
    if (category) {
        statusOptions = await db.query.tags.findMany({
            where: eq(tags.categoryId, category.id),
        });
    }

    return NextResponse.json({
        employees: employeesList,
        statusOptions,
    });
}
