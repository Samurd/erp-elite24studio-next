import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { socialMediaPosts, filesLinks } from "@/drizzle/schema";
import { eq, like, and, desc, sql, gte, lte } from "drizzle-orm"; // Changed from 'drizzle-orm/expressions' to 'drizzle-orm'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const perPage = parseInt(searchParams.get("per_page") || "10");
        const search = searchParams.get("search") || "";

        const mediumsFilter = searchParams.get("mediums_filter");
        const contentTypeFilter = searchParams.get("content_type_filter");
        const statusFilter = searchParams.get("status_filter");
        const projectFilter = searchParams.get("project_filter");
        const responsibleFilter = searchParams.get("responsible_filter");
        const dateFrom = searchParams.get("date_from");
        const dateTo = searchParams.get("date_to");

        let whereClause = undefined;
        const conditions = [];

        if (search) {
            conditions.push(
                sql`(${socialMediaPosts.pieceName} LIKE ${`%${search}%`} OR ${socialMediaPosts.comments} LIKE ${`%${search}%`})`
            );
        }

        if (mediumsFilter) conditions.push(like(socialMediaPosts.mediums, `%${mediumsFilter}%`));
        if (contentTypeFilter) conditions.push(like(socialMediaPosts.contentType, `%${contentTypeFilter}%`));
        if (statusFilter && statusFilter !== 'all') conditions.push(eq(socialMediaPosts.statusId, parseInt(statusFilter)));
        if (projectFilter && projectFilter !== 'all') conditions.push(eq(socialMediaPosts.projectId, parseInt(projectFilter)));
        if (responsibleFilter && responsibleFilter !== 'all') conditions.push(eq(socialMediaPosts.responsibleId, parseInt(responsibleFilter)));

        if (dateFrom) conditions.push(gte(socialMediaPosts.scheduledDate, dateFrom));
        if (dateTo) conditions.push(lte(socialMediaPosts.scheduledDate, dateTo));

        if (conditions.length > 0) {
            whereClause = and(...conditions);
        }

        const data = await db.query.socialMediaPosts.findMany({
            where: whereClause,
            limit: perPage,
            offset: (page - 1) * perPage,
            orderBy: desc(socialMediaPosts.createdAt),
            with: {
                status: true,
                responsible: true,
                project: true,
            }
        });

        const totalResult = await db.select({ count: sql`count(*)` })
            .from(socialMediaPosts)
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
        console.error("Error fetching social media posts:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (!body.piece_name || !body.status_id) {
            return NextResponse.json({ error: "Piece name and status are required" }, { status: 400 });
        }

        const [result] = await db.insert(socialMediaPosts).values({
            pieceName: body.piece_name,
            mediums: body.mediums,
            contentType: body.content_type,
            scheduledDate: body.scheduled_date || null,
            projectId: body.project_id ? parseInt(body.project_id) : null,
            responsibleId: body.responsible_id || null,
            statusId: parseInt(body.status_id),
            comments: body.comments,
            createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
            updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
        }).returning({ insertedId: socialMediaPosts.id });

        const postId = result.insertedId;

        // Handle file linking if pending files exist
        if (body.pending_file_ids && body.pending_file_ids.length > 0) {
            for (const fileItem of body.pending_file_ids) {
                // Ensure we get the ID whether it's an object or a primitive
                const fileId = typeof fileItem === 'object' && fileItem !== null ? fileItem.id : fileItem;

                await db.insert(filesLinks).values({
                    fileId: fileId,
                    fileableId: postId,
                    fileableType: 'App\\Models\\SocialMediaPost'
                });
            }
        }

        return NextResponse.json({ success: true, id: postId });
    } catch (error) {
        console.error("Error creating social media post:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
