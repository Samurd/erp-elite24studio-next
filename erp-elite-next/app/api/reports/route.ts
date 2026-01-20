import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reports, tags } from "@/drizzle/schema";
import { and, desc, eq, like, gte, lte, or, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("per_page") || "10");
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
        conditions.push(
            or(
                like(reports.title, `%${search}%`),
                like(reports.description, `%${search}%`)
            )
        );
    }

    if (status && status !== "all") {
        const statusId = parseInt(status);
        if (!isNaN(statusId)) {
            conditions.push(eq(reports.statusId, statusId));
        }
    }

    if (dateFrom) {
        conditions.push(gte(reports.date, dateFrom));
    }

    if (dateTo) {
        conditions.push(lte(reports.date, dateTo));
    }

    try {
        const data = await db.select({
            id: reports.id,
            title: reports.title,
            description: reports.description,
            date: reports.date,
            hour: reports.hour,
            statusId: reports.statusId,
            status: {
                id: tags.id,
                name: tags.name,
                color: tags.color
            },
            notes: reports.notes,
            createdAt: reports.createdAt
        })
            .from(reports)
            .leftJoin(tags, eq(reports.statusId, tags.id))
            .where(and(...conditions))
            .orderBy(desc(reports.date), desc(reports.createdAt))
            .limit(limit)
            .offset(offset);

        // Count total for pagination
        const totalResult = await db.select({ count: sql<number>`count(*)` })
            .from(reports)
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
        console.error("Error fetching reports:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Basic validation could go here

        const [insertedReport] = await db.insert(reports).values({
            title: body.title,
            description: body.description,
            date: body.date,
            hour: body.hour,
            statusId: body.status_id ? parseInt(body.status_id) : null,
            notes: body.notes,
            // Assuming current user creation logic would go here if we tracked createdBy
            // createdBy: session.user.id 
        }).returning({ id: reports.id });

        if (body.pending_file_ids && Array.isArray(body.pending_file_ids)) {
            const { attachFileToModel } = await import("@/actions/files")
            for (const fileId of body.pending_file_ids) {
                await attachFileToModel(fileId, "App\\Models\\Report", insertedReport.id);
            }
        }

        return NextResponse.json({ id: insertedReport.id, message: "Report created successfully" }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating report:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
