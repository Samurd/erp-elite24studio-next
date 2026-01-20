import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audits, filesLinks, tags, tagCategories } from "@/drizzle/schema";
import { and, desc, eq, like, or, sql, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const activeTab = searchParams.get("active_tab");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = parseInt(searchParams.get("per_page") || "10");
    const offset = (page - 1) * limit;

    const conditions = [];

    // Filter by active tab (audit type slug)
    if (activeTab) {
        // Get the tag ID for this slug
        const typeTag = await db.query.tags.findFirst({
            where: eq(tags.slug, activeTab)
        });

        if (typeTag) {
            conditions.push(eq(audits.typeId, typeTag.id));
        }
    }

    if (search) {
        conditions.push(
            or(
                sql`CAST(${audits.objective} AS TEXT) LIKE ${`%${search}%`}`,
                like(audits.place, `%${search}%`)
            )
        );
    }

    try {
        const data = await db.query.audits.findMany({
            where: and(...conditions),
            with: {
                tag_typeId: true,
                tag_statusId: true,
            },
            limit: limit,
            offset: offset,
            orderBy: [desc(audits.dateAudit)],
        });

        // Fetch file counts
        const recordIds = data.map(r => r.id);
        const fileCountsMap = new Map();

        if (recordIds.length > 0) {
            const counts = await db.select({
                fileableId: filesLinks.fileableId,
                count: sql<number>`count(*)`
            })
                .from(filesLinks)
                .where(and(
                    eq(filesLinks.fileableType, 'App\\Models\\Audit'),
                    inArray(filesLinks.fileableId, recordIds)
                ))
                .groupBy(filesLinks.fileableId);

            counts.forEach(c => {
                fileCountsMap.set(c.fileableId, c.count);
            });
        }

        const dataWithFiles = data.map(r => ({
            ...r,
            type: r.tag_typeId,
            status: r.tag_statusId,
            filesCount: fileCountsMap.get(r.id) || 0,
        }));

        const totalResult = await db.select({ count: sql<number>`count(*)` })
            .from(audits)
            .where(and(...conditions));
        const total = totalResult[0].count;

        return NextResponse.json({
            data: dataWithFiles,
            meta: {
                current_page: page,
                per_page: limit,
                total,
                last_page: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error("Error fetching audits:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validation
        if (!body.date_register || !body.date_audit || !body.objective || !body.place) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const result = await db.insert(audits).values({
            dateRegister: body.date_register,
            dateAudit: body.date_audit,
            objective: Number(body.objective),
            typeId: body.type_id ? parseInt(body.type_id) : null,
            place: body.place,
            statusId: body.status_id ? parseInt(body.status_id) : null,
            observations: body.observations,
        }).returning({ id: audits.id });

        const recordId = result[0].id;

        if (body.pending_file_ids && body.pending_file_ids.length > 0) {
            for (const fileId of body.pending_file_ids) {
                await db.insert(filesLinks).values({
                    fileId: parseInt(fileId),
                    fileableId: recordId,
                    fileableType: 'App\\Models\\Audit',
                }).onConflictDoNothing();
            }
        }

        return NextResponse.json({ id: recordId, message: "Audit created" }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating audit:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
