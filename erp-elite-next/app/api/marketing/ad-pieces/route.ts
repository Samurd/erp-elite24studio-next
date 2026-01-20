import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adpieces, filesLinks } from "@/drizzle/schema";
import { eq, like, and, desc, sql } from "drizzle-orm";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const perPage = parseInt(searchParams.get("per_page") || "10");
        const search = searchParams.get("search") || "";

        const typeFilter = searchParams.get("type_filter");
        const formatFilter = searchParams.get("format_filter");
        const statusFilter = searchParams.get("status_filter");
        const projectFilter = searchParams.get("project_filter");
        const teamFilter = searchParams.get("team_filter");
        const strategyFilter = searchParams.get("strategy_filter");
        const mediaFilter = searchParams.get("media_filter");

        const conditions = [];

        if (search) {
            conditions.push(
                sql`(${adpieces.name} LIKE ${`%${search}%`} OR ${adpieces.media} LIKE ${`%${search}%`})`
            );
        }

        if (typeFilter && typeFilter !== 'all') conditions.push(eq(adpieces.typeId, parseInt(typeFilter)));
        if (formatFilter && formatFilter !== 'all') conditions.push(eq(adpieces.formatId, parseInt(formatFilter)));
        if (statusFilter && statusFilter !== 'all') conditions.push(eq(adpieces.statusId, parseInt(statusFilter)));
        if (projectFilter && projectFilter !== 'all') conditions.push(eq(adpieces.projectId, parseInt(projectFilter)));
        if (teamFilter && teamFilter !== 'all') conditions.push(eq(adpieces.teamId, parseInt(teamFilter)));
        if (strategyFilter && strategyFilter !== 'all') conditions.push(eq(adpieces.strategyId, parseInt(strategyFilter)));
        if (mediaFilter) conditions.push(like(adpieces.media, `%${mediaFilter}%`));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const data = await db.query.adpieces.findMany({
            where: whereClause,
            limit: perPage,
            offset: (page - 1) * perPage,
            orderBy: desc(adpieces.createdAt),
            with: {
                type: true,
                format: true,
                status: true,
                project: true,
                team: true,
                strategy: true,
            }
        });

        const totalResult = await db.select({ count: sql`count(*)` })
            .from(adpieces)
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
        console.error("Error fetching marketing ad pieces:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (!body.name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const [result] = await db.insert(adpieces).values({
            name: body.name,
            media: body.media || null,
            instructions: body.instructions || null,
            typeId: body.type_id ? parseInt(body.type_id) : null,
            formatId: body.format_id ? parseInt(body.format_id) : null,
            statusId: body.status_id ? parseInt(body.status_id) : null,
            projectId: body.project_id ? parseInt(body.project_id) : null,
            teamId: body.team_id ? parseInt(body.team_id) : null,
            strategyId: body.strategy_id ? parseInt(body.strategy_id) : null,
            createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
            updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
        }).returning({ id: adpieces.id });

        const adPieceId = result.id;

        // Handle file linking if pending files exist
        if (body.pending_file_ids && body.pending_file_ids.length > 0) {
            for (const fileItem of body.pending_file_ids) {
                const fileId = typeof fileItem === 'object' && fileItem.id ? fileItem.id : fileItem;

                await db.insert(filesLinks).values({
                    fileId: fileId,
                    fileableType: 'App\\Models\\Adpiece',
                    fileableId: adPieceId,
                    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
                    updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
                });
            }
        }

        return NextResponse.json({ success: true, id: adPieceId });
    } catch (error) {
        console.error("Error creating marketing ad piece:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
