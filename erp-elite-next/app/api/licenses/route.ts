import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { licenses, filesLinks } from "@/drizzle/schema";
import { and, desc, eq, like, gte, lte, or, sql, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const licenseType = searchParams.get("license_type_filter");
    const status = searchParams.get("status_filter");
    const entity = searchParams.get("entity_filter");
    const company = searchParams.get("company_filter");
    const requiresExtension = searchParams.get("requires_extension_filter");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("per_page") || "10");
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
        conditions.push(
            or(
                like(licenses.entity, `%${search}%`),
                like(licenses.company, `%${search}%`),
                like(licenses.eradicatedNumber, `%${search}%`)
            )
        );
    }

    if (licenseType && licenseType !== "all") {
        conditions.push(eq(licenses.licenseTypeId, parseInt(licenseType)));
    }

    if (status && status !== "all") {
        conditions.push(eq(licenses.statusId, parseInt(status)));
    }

    if (entity) {
        conditions.push(like(licenses.entity, `%${entity}%`));
    }

    if (company) {
        conditions.push(like(licenses.company, `%${company}%`));
    }

    if (requiresExtension !== null && requiresExtension !== "" && requiresExtension !== "all") {
        conditions.push(eq(licenses.requiresExtension, requiresExtension === '1' ? 1 : 0));
    }

    if (dateFrom) {
        conditions.push(gte(licenses.expirationDate, dateFrom));
    }

    if (dateTo) {
        conditions.push(lte(licenses.expirationDate, dateTo));
    }

    try {
        const data = await db.query.licenses.findMany({
            where: and(...conditions),
            with: {
                licenseType: true,
                status: true,
                project: true,
            },
            limit: limit,
            offset: offset,
            orderBy: [desc(licenses.createdAt)],
        });

        // Fetch file counts
        const licenseIds = data.map(l => l.id);
        const fileCountsMap = new Map();

        if (licenseIds.length > 0) {
            const counts = await db.select({
                fileableId: filesLinks.fileableId,
                count: sql<number>`count(*)`
            })
                .from(filesLinks)
                .where(and(
                    eq(filesLinks.fileableType, 'App\\Models\\License'),
                    inArray(filesLinks.fileableId, licenseIds)
                ))
                .groupBy(filesLinks.fileableId);

            counts.forEach(c => {
                fileCountsMap.set(c.fileableId, c.count);
            });
        }

        const dataWithFiles = data.map(l => ({
            ...l,
            filesCount: fileCountsMap.get(l.id) || 0,
            files: [] // Return empty array, count is handled by filesCount
        }));

        const totalResult = await db.select({ count: sql<number>`count(*)` })
            .from(licenses)
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
        console.error("Error fetching licenses:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validation - basic checks
        if (!body.project_id || !body.license_type_id) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const result = await db.insert(licenses).values({
            projectId: parseInt(body.project_id),
            licenseTypeId: parseInt(body.license_type_id),
            statusId: body.status_id ? parseInt(body.status_id) : null,
            entity: body.entity,
            company: body.company,
            eradicatedNumber: body.eradicated_number,
            eradicatdDate: body.eradicatd_date || null,
            estimatedApprovalDate: body.estimated_approval_date || null,
            expirationDate: body.expiration_date || null,
            requiresExtension: body.requires_extension ? 1 : 0,
            observations: body.observations,
        }).returning({ id: licenses.id });

        const licenseId = result[0].id;

        if (body.pending_file_ids && Array.isArray(body.pending_file_ids)) {
            const { attachFileToModel } = await import("@/actions/files")
            for (const fileId of body.pending_file_ids) {
                await attachFileToModel(fileId, "App\\Models\\License", licenseId);
            }
        }

        return NextResponse.json({ id: licenseId, message: "License created" }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating license:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
