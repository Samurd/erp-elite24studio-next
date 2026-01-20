
import { db } from "@/lib/db";
import { punchItems, filesLinks } from "@/drizzle/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const worksiteId = parseInt(id);

        const items = await db.query.punchItems.findMany({
            where: eq(punchItems.worksiteId, worksiteId),
            orderBy: [desc(punchItems.createdAt)],
            with: {
                status: true,
                responsible: true,
            },
        });

        return NextResponse.json(items);
    } catch (error) {
        console.error("Error fetching punch items:", error);
        return NextResponse.json(
            { error: "Error fetching punch items" },
            { status: 500 }
        );
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const worksiteId = parseInt(id);
        const body = await req.json();

        // Validate required fields
        if (!body.observations) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const newItem = await db
            .insert(punchItems)
            .values({
                worksiteId,
                observations: body.observations,
                statusId: body.status_id && body.status_id !== "none" ? parseInt(body.status_id) : null,
                responsibleId: body.responsible_id && body.responsible_id !== "none" ? body.responsible_id : null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            })
            .returning();

        const punchItemId = newItem[0].id;

        if (body.pending_file_ids && body.pending_file_ids.length > 0) {
            for (const fileId of body.pending_file_ids) {
                await db.insert(filesLinks).values({
                    fileId: parseInt(fileId),
                    fileableId: punchItemId,
                    fileableType: 'App\\Models\\PunchItem',
                }).onDuplicateKeyUpdate({ set: { id: sql`id` } });
            }
        }

        return NextResponse.json(newItem[0]);
    } catch (error) {
        console.error("Error creating punch item:", error);
        return NextResponse.json(
            { error: "Error creating punch item" },
            { status: 500 }
        );
    }
}
