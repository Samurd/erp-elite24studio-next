import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { strategies, files, filesLinks } from "@/drizzle/schema";
import { eq, like, and, desc, sql, gte, lte } from "drizzle-orm";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const perPage = parseInt(searchParams.get("per_page") || "10");
        const search = searchParams.get("search") || "";
        const statusFilter = searchParams.get("status_filter");
        const responsibleFilter = searchParams.get("responsible_filter");
        const platformFilter = searchParams.get("platform_filter");
        const targetAudienceFilter = searchParams.get("target_audience_filter");
        const dateFrom = searchParams.get("date_from");
        const dateTo = searchParams.get("date_to");

        let whereClause = undefined;
        const conditions = [];

        if (search) {
            conditions.push(
                sql`(${strategies.name} LIKE ${`%${search}%`} OR ${strategies.objective} LIKE ${`%${search}%`} OR ${strategies.observations} LIKE ${`%${search}%`})`
            );
        }

        if (statusFilter) {
            conditions.push(eq(strategies.statusId, parseInt(statusFilter)));
        }

        if (responsibleFilter) {
            conditions.push(eq(strategies.responsibleId, parseInt(responsibleFilter)));
        }

        if (platformFilter) {
            conditions.push(like(strategies.platforms, `%${platformFilter}%`));
        }

        if (targetAudienceFilter) {
            conditions.push(like(strategies.targetAudience, `%${targetAudienceFilter}%`));
        }

        if (dateFrom) {
            conditions.push(gte(strategies.startDate, dateFrom));
        }

        if (dateTo) {
            conditions.push(lte(strategies.endDate, dateTo));
        }

        if (conditions.length > 0) {
            whereClause = and(...conditions);
        }

        const data = await db.query.strategies.findMany({
            where: whereClause,
            limit: perPage,
            offset: (page - 1) * perPage,
            orderBy: desc(strategies.createdAt),
            with: {
                status: true,
                responsible: true
            }
        });

        const totalResult = await db.select({ count: sql`count(*)` })
            .from(strategies)
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
        console.error("Error fetching strategies:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

import { attachFileToModel } from "@/actions/files";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Basic validation
        if (!body.name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const [result] = await db.insert(strategies).values({
            name: body.name,
            objective: body.objective,
            statusId: body.status_id ? parseInt(body.status_id) : null,
            startDate: body.start_date || null,
            endDate: body.end_date || null,
            targetAudience: body.target_audience,
            platforms: body.platforms,
            responsibleId: body.responsible_id || null,
            notifyTeam: body.notify_team ? 1 : 0,
            addToCalendar: body.add_to_calendar ? 1 : 0,
            observations: body.observations,
            createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
            updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
        }).returning({ id: strategies.id });

        const strategyId = result.id;

        // Handle file linking if pending files exist
        if (body.pending_file_ids && body.pending_file_ids.length > 0) {
            for (const fileId of body.pending_file_ids) {
                await attachFileToModel(fileId, 'App\\Models\\Strategy', strategyId);
            }
        }

        return NextResponse.json({ success: true, id: strategyId });

    } catch (error) {
        console.error("Error creating strategy:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
