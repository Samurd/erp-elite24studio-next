import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { certificates, filesLinks } from "@/drizzle/schema";
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
                like(certificates.name, `%${search}%`),
                like(certificates.description, `%${search}%`)
            )
        );
    }

    if (type) {
        conditions.push(eq(certificates.typeId, parseInt(type)));
    }

    if (status) {
        conditions.push(eq(certificates.statusId, parseInt(status)));
    }

    if (assignedTo) {
        conditions.push(eq(certificates.assignedToId, parseInt(assignedTo)));
    }

    if (dateFrom) {
        conditions.push(gte(certificates.issuedAt, dateFrom));
    }

    if (dateTo) {
        conditions.push(lte(certificates.issuedAt, dateTo));
    }

    try {
        const data = await db.query.certificates.findMany({
            where: and(...conditions),
            with: {
                type: true,
                status: true,
                assignedTo: true,
            },
            limit: limit,
            offset: offset,
            orderBy: [desc(certificates.issuedAt)],
        });

        // Fetch file counts
        const certificateIds = data.map(c => c.id);
        const fileCountsMap = new Map();

        if (certificateIds.length > 0) {
            const counts = await db.select({
                fileableId: filesLinks.fileableId,
                count: sql<number>`count(*)`
            })
                .from(filesLinks)
                .where(and(
                    eq(filesLinks.fileableType, 'App\\Models\\Certificate'),
                    inArray(filesLinks.fileableId, certificateIds)
                ))
                .groupBy(filesLinks.fileableId);

            counts.forEach(c => {
                fileCountsMap.set(c.fileableId, c.count);
            });
        }

        const dataWithFiles = data.map(c => ({
            ...c,
            filesCount: fileCountsMap.get(c.id) || 0,
            files: [] // Return empty array, count is handled by filesCount
        }));

        // Basic count
        const totalResult = await db.select({ count: sql<number>`count(*)` })
            .from(certificates)
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
        console.error("Error fetching certificates:", error);
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

        const [insertedCertificate] = await db.insert(certificates).values({
            name: body.name,
            typeId: parseInt(body.type_id),
            statusId: body.status_id ? parseInt(body.status_id) : null,
            assignedToId: body.assigned_to_id || null, // UUID
            issuedAt: body.issued_at || null,
            expiresAt: body.expires_at || null,
            description: body.description,
        }).returning({ id: certificates.id });

        const certificateId = insertedCertificate.id;

        if (body.pending_file_ids && Array.isArray(body.pending_file_ids)) {
            const { attachFileToModel } = await import("@/actions/files")
            for (const fileId of body.pending_file_ids) {
                await attachFileToModel(fileId, "App\\Models\\Certificate", certificateId);
            }
        }

        return NextResponse.json({ id: certificateId, message: "Certificate created" }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating certificate:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
