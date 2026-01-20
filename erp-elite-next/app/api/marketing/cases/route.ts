import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { caseMarketings, filesLinks } from "@/drizzle/schema";
import { eq, like, and, desc, sql, gte, lte } from "drizzle-orm";
import { DateService } from "@/lib/date-service";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const perPage = parseInt(searchParams.get("per_page") || "10");
        const search = searchParams.get("search") || "";

        const typeFilter = searchParams.get("type_filter");
        const statusFilter = searchParams.get("status_filter");
        const projectFilter = searchParams.get("project_filter");
        const responsibleFilter = searchParams.get("responsible_filter");
        const mediumsFilter = searchParams.get("mediums_filter");
        const dateFrom = searchParams.get("date_from");
        const dateTo = searchParams.get("date_to");

        const conditions = [];

        if (search) {
            conditions.push(
                sql`(${caseMarketings.subject} LIKE ${`%${search}%`} OR ${caseMarketings.description} LIKE ${`%${search}%`})`
            );
        }

        if (typeFilter && typeFilter !== 'all') conditions.push(eq(caseMarketings.typeId, parseInt(typeFilter)));
        if (statusFilter && statusFilter !== 'all') conditions.push(eq(caseMarketings.statusId, parseInt(statusFilter)));
        if (projectFilter && projectFilter !== 'all') conditions.push(eq(caseMarketings.projectId, parseInt(projectFilter)));
        if (responsibleFilter && responsibleFilter !== 'all') conditions.push(eq(caseMarketings.responsibleId, parseInt(responsibleFilter)));
        if (mediumsFilter) conditions.push(like(caseMarketings.mediums, `%${mediumsFilter}%`));

        if (dateFrom) conditions.push(gte(caseMarketings.date, dateFrom));
        if (dateTo) conditions.push(lte(caseMarketings.date, dateTo));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const data = await db.query.caseMarketings.findMany({
            where: whereClause,
            limit: perPage,
            offset: (page - 1) * perPage,
            orderBy: desc(caseMarketings.createdAt),
            with: {
                type: true,
                status: true,
                responsible: true,
                project: true,
            }
        });

        const totalResult = await db.select({ count: sql`count(*)` })
            .from(caseMarketings)
            .where(whereClause);

        const total = totalResult[0]?.count || 0;

        return NextResponse.json({
            data,
            meta: {
                total: Number(total),
                per_page: perPage,
                current_page: page,
                last_page: Math.ceil(Number(total) / perPage)
            }
        });
    } catch (error) {
        console.error("Error fetching marketing cases:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (!body.subject || !body.date) {
            return NextResponse.json({ error: "Subject and date are required" }, { status: 400 });
        }

        const [result] = await db.insert(caseMarketings).values({
            subject: body.subject,
            mediums: body.mediums || null,
            description: body.description || null,
            date: body.date || null,
            projectId: body.project_id ? parseInt(body.project_id) : null,
            responsibleId: body.responsible_id || null,
            typeId: body.type_id ? parseInt(body.type_id) : null,
            statusId: body.status_id ? parseInt(body.status_id) : null,
            createdAt: DateService.toISO(),
            updatedAt: DateService.toISO()
        }).returning({ id: caseMarketings.id });

        const caseId = result.id;

        // Handle file linking if pending files exist
        if (body.pending_file_ids && body.pending_file_ids.length > 0) {
            for (const fileItem of body.pending_file_ids) {
                // Ensure we get the ID whether it's an object or a primitive
                const fileId = typeof fileItem === 'object' && fileItem !== null ? fileItem.id : fileItem;

                await db.insert(filesLinks).values({
                    fileId: fileId,
                    fileableId: caseId,
                    fileableType: 'App\\Models\\CaseMarketing'
                });
            }
        }

        return NextResponse.json({ success: true, id: caseId });
    } catch (error) {
        console.error("Error creating marketing case:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
