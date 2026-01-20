import { db } from "@/lib/db";
import { applicants } from "@/drizzle/schema";
import { count, desc, eq, and, like, or } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const statusId = searchParams.get("statusId");
        const vacancyId = searchParams.get("vacancyId");
        const offset = (page - 1) * limit;

        const whereClause = and(
            search
                ? or(
                    like(applicants.fullName, `%${search}%`),
                    like(applicants.email, `%${search}%`),
                    like(applicants.notes, `%${search}%`)
                )
                : undefined,
            statusId ? eq(applicants.statusId, parseInt(statusId)) : undefined,
            vacancyId ? eq(applicants.vacancyId, parseInt(vacancyId)) : undefined
        );

        const data = await db.query.applicants.findMany({
            where: whereClause,
            with: {
                vacancy: true,
                status: true
            },
            limit: limit,
            offset: offset,
            orderBy: [desc(applicants.createdAt)],
        });

        const totalResult = await db
            .select({ count: count() })
            .from(applicants)
            .where(whereClause);

        const total = totalResult[0].count;

        // Map to snake_case for frontend consistency
        const mappedData = data.map(app => ({
            ...app,
            full_name: app.fullName,
            vacancy_id: app.vacancyId,
            status_id: app.statusId,
            created_at: app.createdAt
        }));

        return NextResponse.json({
            data: mappedData,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching applicants:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Safe parsing to prevent NaN values
        const safeParseInt = (val: any) => {
            if (!val) return null;
            const parsed = parseInt(val);
            return isNaN(parsed) ? null : parsed;
        };

        const result = await db.insert(applicants).values({
            fullName: body.full_name,
            email: body.email,
            vacancyId: safeParseInt(body.vacancy_id) || 0, // Should be required, keeping 0 as fallback if that's intended logic
            statusId: safeParseInt(body.status_id),
            notes: body.notes,
            createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
            updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        }).returning({ id: applicants.id });

        return NextResponse.json({ success: true, id: result[0].id });
    } catch (error) {
        console.error("Error creating applicant:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
