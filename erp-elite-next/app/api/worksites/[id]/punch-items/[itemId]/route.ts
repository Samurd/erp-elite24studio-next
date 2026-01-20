
import { db } from "@/lib/db";
import { punchItems, files, filesLinks } from "@/drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; itemId: string }> }
) {
    try {
        const { itemId } = await params;
        const id = parseInt(itemId);

        const item = await db.query.punchItems.findFirst({
            where: eq(punchItems.id, id),
            with: {
                status: true,
                responsible: true,
            },
        });

        if (!item) {
            return NextResponse.json(
                { error: "Punch item not found" },
                { status: 404 }
            );
        }

        // Fetch associated files
        const associatedFiles = await db.select({
            id: files.id,
            name: files.name,
            path: files.path,
            mimeType: files.mimeType,
            size: files.size,
        })
            .from(files)
            .innerJoin(filesLinks, eq(files.id, filesLinks.fileId))
            .where(and(
                eq(filesLinks.fileableType, 'App\\Models\\PunchItem'),
                eq(filesLinks.fileableId, id)
            ));

        (item as any).files = associatedFiles.map(f => ({
            ...f,
            url: f.path
        }));

        return NextResponse.json(item);
    } catch (error) {
        console.error("Error fetching punch item:", error);
        return NextResponse.json(
            { error: "Error fetching punch item" },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; itemId: string }> }
) {
    try {
        const { itemId } = await params;
        const id = parseInt(itemId);
        const body = await req.json();

        const updatedItem = await db
            .update(punchItems)
            .set({
                observations: body.observations,
                statusId: body.status_id && body.status_id !== "none" ? parseInt(body.status_id) : null,
                responsibleId: body.responsible_id && body.responsible_id !== "none" ? body.responsible_id : null,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(punchItems.id, id))
            .returning();

        if (body.pending_file_ids && body.pending_file_ids.length > 0) {
            for (const fileId of body.pending_file_ids) {
                await db.insert(filesLinks).values({
                    fileId: parseInt(fileId),
                    fileableId: id,
                    fileableType: 'App\\Models\\PunchItem',
                }).onDuplicateKeyUpdate({ set: { id: sql`id` } });
            }
        }

        return NextResponse.json(updatedItem[0]);

    } catch (error) {
        console.error("Error updating punch item:", error);
        return NextResponse.json(
            { error: "Error updating punch item" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; itemId: string }> }
) {
    try {
        const { itemId } = await params;
        const id = parseInt(itemId);

        await db.delete(punchItems).where(eq(punchItems.id, id));

        return NextResponse.json({ message: "Punch item deleted successfully" });
    } catch (error) {
        console.error("Error deleting punch item:", error);
        return NextResponse.json(
            { error: "Error deleting punch item" },
            { status: 500 }
        );
    }
}
