import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { taxRecords, filesLinks, tags } from "@/drizzle/schema";
import { and, desc, eq, like, gte, lte, or, sql, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const typeFilter = searchParams.get("type_filter");
    const statusFilter = searchParams.get("status_filter");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = parseInt(searchParams.get("per_page") || "10");
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
        conditions.push(like(taxRecords.entity, `%${search}%`));
    }

    if (typeFilter && typeFilter !== "all") {
        conditions.push(eq(taxRecords.typeId, parseInt(typeFilter)));
    }

    if (statusFilter && statusFilter !== "all") {
        conditions.push(eq(taxRecords.statusId, parseInt(statusFilter)));
    }

    if (dateFrom) {
        conditions.push(gte(taxRecords.date, dateFrom));
    }

    if (dateTo) {
        conditions.push(lte(taxRecords.date, dateTo));
    }

    try {
        const data = await db.query.taxRecords.findMany({
            where: and(...conditions),
            with: {
                tag_typeId: true,
                tag_statusId: true,
            },
            limit: limit,
            offset: offset,
            orderBy: [desc(taxRecords.createdAt)],
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
                    eq(filesLinks.fileableType, 'App\\Models\\TaxRecord'),
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
            files: [] // Return empty array, count is handled by filesCount
        }));

        const totalResult = await db.select({ count: sql<number>`count(*)` })
            .from(taxRecords)
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
        console.error("Error fetching taxes:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validation
        if (!body.entity || !body.base || !body.porcentage || !body.amount || !body.date) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const result = await db.insert(taxRecords).values({
            typeId: body.type_id ? parseInt(body.type_id) : null,
            statusId: body.status_id ? parseInt(body.status_id) : null,
            entity: body.entity,
            base: Number(body.base),
            porcentage: Number(body.porcentage),
            amount: Number(body.amount),
            date: body.date,
            observations: body.observations,
        }).returning({ id: taxRecords.id });

        const recordId = result[0].id;

        if (body.pending_file_ids && body.pending_file_ids.length > 0) {
            for (const fileId of body.pending_file_ids) {
                await db.insert(filesLinks).values({
                    fileId: parseInt(fileId),
                    fileableId: recordId,
                    fileableType: 'App\\Models\\TaxRecord',
                }).onConflictDoNothing();
            }
        }

        return NextResponse.json({ id: recordId, message: "Tax record created" }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating tax record:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
