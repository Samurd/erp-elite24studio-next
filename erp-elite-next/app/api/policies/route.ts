import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { policies, filesLinks } from "@/drizzle/schema";
import { and, desc, eq, like, gte, lte, or, sql, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const type = searchParams.get("type_filter");
    const status = searchParams.get("status_filter");
    const assignedTo = searchParams.get("assigned_to_filter");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("per_page") || "10");
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
        conditions.push(
            or(
                like(policies.name, `%${search}%`),
                like(policies.description, `%${search}%`)
            )
        );
    }

    if (type) {
        conditions.push(eq(policies.typeId, parseInt(type)));
    }

    if (status) {
        conditions.push(eq(policies.statusId, parseInt(status)));
    }

    if (assignedTo) {
        conditions.push(eq(policies.assignedToId, parseInt(assignedTo)));
    }

    if (dateFrom) {
        conditions.push(gte(policies.issuedAt, dateFrom));
    }

    if (dateTo) {
        conditions.push(lte(policies.issuedAt, dateTo));
    }

    try {
        const data = await db.query.policies.findMany({
            where: and(...conditions),
            with: {
                type: true,
                status: true,
                assignedTo: true,
            },
            limit: limit,
            offset: offset,
            orderBy: [desc(policies.issuedAt)],
        });

        // Fetch file counts
        const policyIds = data.map(p => p.id);
        const fileCountsMap = new Map();

        if (policyIds.length > 0) {
            const counts = await db.select({
                fileableId: filesLinks.fileableId,
                count: sql<number>`count(*)`
            })
                .from(filesLinks)
                .where(and(
                    eq(filesLinks.fileableType, 'App\\Models\\Policy'),
                    inArray(filesLinks.fileableId, policyIds)
                ))
                .groupBy(filesLinks.fileableId);

            counts.forEach(c => {
                fileCountsMap.set(c.fileableId, c.count);
            });
        }

        const dataWithCounts = data.map(p => ({
            ...p,
            filesCount: fileCountsMap.get(p.id) || 0
        }));

        // Basic count
        const totalResult = await db.select({ count: sql<number>`count(*)` })
            .from(policies)
            .where(and(...conditions));
        const total = totalResult[0].count;

        return NextResponse.json({
            data: dataWithCounts,
            meta: {
                current_page: page,
                per_page: limit,
                total,
                last_page: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error("Error fetching policies:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validation - basic checks
        if (!body.name || !body.type_id || !body.issued_at) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const [insertedPolicy] = await db.insert(policies).values({
            name: body.name,
            typeId: parseInt(body.type_id),
            statusId: body.status_id ? parseInt(body.status_id) : null,
            assignedToId: body.assigned_to_id || null, // UUID, do not parseInt
            issuedAt: body.issued_at || null,
            reviewedAt: body.reviewed_at ? body.reviewed_at : null,
            description: body.description,
        }).returning({ id: policies.id });

        const policyId = insertedPolicy.id;

        if (body.pending_file_ids && Array.isArray(body.pending_file_ids)) {
            const { attachFileToModel } = await import("@/actions/files")
            for (const fileId of body.pending_file_ids) {
                await attachFileToModel(fileId, "App\\Models\\Policy", policyId);
            }
        }

        return NextResponse.json({ id: policyId, message: "Policy created" }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating policy:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
