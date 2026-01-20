import { db } from "@/lib/db";
import { vacancies, tags, applicants } from "@/drizzle/schema";
import { count, desc, eq, and, like, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { DateService } from "@/lib/date-service";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const contractTypeId = searchParams.get("contractTypeId");
        const statusId = searchParams.get("statusId");
        const offset = (page - 1) * limit;

        const whereClause = and(
            search
                ? like(vacancies.title, `%${search}%`)
                : undefined,
            contractTypeId ? eq(vacancies.contractTypeId, parseInt(contractTypeId)) : undefined,
            statusId ? eq(vacancies.statusId, parseInt(statusId)) : undefined
        );

        const data = await db.query.vacancies.findMany({
            where: whereClause,
            with: {
                contractType: true,
                status: true,
                user: true,
                // applicants: true // We might want a count instead, handled separately or via raw query if relation count not supported directly
            },
            limit: limit,
            offset: offset,
            orderBy: [desc(vacancies.createdAt)],
        });

        // Get applicants count for each vacancy
        // Since drizzle doesn't support relation aggregates easily in query builder yet efficiently for lists, 
        // we might just fetch them or do a separate count query. 
        // For now, let's just loop and count if the list is small, or easier:
        // Use a workaround or rely on simple fetch. 
        // Actually, let's fetching counts separately is cleaner for performance usually.
        // Or simpler: include applicants array and count length (bad for large scale).
        // Let's stick to standard relations for now.

        // Optimizing counts:
        const vacanciesWithCounts = await Promise.all(data.map(async (v) => {
            const applicantsCount = await db
                .select({ count: count() })
                .from(applicants)
                .where(eq(applicants.vacancyId, v.id));

            return {
                ...v,
                applicants_count: applicantsCount[0].count
            }
        }));


        const totalResult = await db
            .select({ count: count() })
            .from(vacancies)
            .where(whereClause);

        const total = totalResult[0].count;

        return NextResponse.json({
            data: vacanciesWithCounts,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching vacancies:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Basic validation could go here
        const safeParseInt = (val: any) => {
            if (!val) return null;
            const parsed = parseInt(val);
            return isNaN(parsed) ? null : parsed;
        };

        const result = await db.insert(vacancies).values({
            title: body.title,
            area: body.area,
            contractTypeId: safeParseInt(body.contract_type_id),
            publishedAt: body.published_at ? DateService.toDB(new Date(body.published_at)) : null,
            statusId: safeParseInt(body.status_id),
            userId: safeParseInt(body.user_id), // Responsible
            description: body.description,
            createdAt: DateService.toISO(new Date()).slice(0, 19).replace('T', ' '),
            updatedAt: DateService.toISO(new Date()).slice(0, 19).replace('T', ' '),
        }).returning({ id: vacancies.id });

        // Ensure insertId is properly retrieved - 'result' structure depends on driver
        // For mysql2/drizzle, result[0].insertId is typical

        return NextResponse.json({ success: true, id: result[0].id });
    } catch (error) {
        console.error("Error creating vacancy:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
