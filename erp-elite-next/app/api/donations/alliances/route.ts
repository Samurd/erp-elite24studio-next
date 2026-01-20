import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { alliances } from "@/drizzle/schema";
import { and, desc, eq, like, or, sql, gte, lte } from "drizzle-orm";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const typeId = searchParams.get("type_filter");
    const certified = searchParams.get("certified_filter");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = parseInt(searchParams.get("per_page") || "10");
    const offset = (page - 1) * limit;

    const conditions = [];

    // Search
    if (search) {
        conditions.push(like(alliances.name, `%${search}%`));
    }

    // Filters
    if (typeId) conditions.push(eq(alliances.typeId, parseInt(typeId)));

    if (certified !== null && certified !== undefined && certified !== '') {
        conditions.push(eq(alliances.certified, parseInt(certified)));
    }

    if (dateFrom) {
        conditions.push(gte(alliances.startDate, dateFrom));
    }

    if (dateTo) {
        conditions.push(lte(alliances.startDate, dateTo));
    }

    try {
        const data = await db.query.alliances.findMany({
            where: and(...conditions),
            with: {
                type: true,
            },
            limit: limit,
            offset: offset,
            orderBy: [desc(alliances.createdAt)],
        });

        const totalResult = await db.select({ count: sql<number>`count(*)` })
            .from(alliances)
            .where(and(...conditions));
        const total = totalResult[0].count;

        return NextResponse.json({
            data,
            meta: {
                current_page: page,
                per_page: limit,
                total,
                last_page: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error("Error fetching alliances:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        if (!body.name || !body.start_date) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const [insertedAlliance] = await db.insert(alliances).values({
            name: body.name,
            typeId: body.type_id ? parseInt(body.type_id) : null,
            startDate: body.start_date,
            validity: body.validity ? parseInt(body.validity) : null,
            certified: body.certified ? 1 : 0,
        }).returning({
            id: alliances.id,
        });

        if (body.pending_file_ids && Array.isArray(body.pending_file_ids)) {
            const { attachFileToModel } = await import("@/actions/files");
            for (const fileId of body.pending_file_ids) {
                await attachFileToModel(fileId, "App\\Models\\Alliance", insertedAlliance.id);
            }
        }

        return NextResponse.json({ id: insertedAlliance.id, message: "Alliance created" }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating alliance:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
