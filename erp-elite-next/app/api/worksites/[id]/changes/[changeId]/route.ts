
import { db } from "@/lib/db";
import { changes, files, filesLinks } from "@/drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; changeId: string }> }
) {
    try {
        const { changeId } = await params;
        const id = parseInt(changeId);

        const change = await db.query.changes.findFirst({
            where: eq(changes.id, id),
            with: {
                type: true,
                status: true,
                budgetImpact: true,
                approver: {
                    columns: { id: true, name: true, profilePhotoUrl: true },
                },
            },
        });

        if (!change) {
            return NextResponse.json(
                { error: "Change not found" },
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
                eq(filesLinks.fileableType, 'App\\Models\\WorksiteChange'),
                eq(filesLinks.fileableId, id)
            ));

        (change as any).files = associatedFiles.map(f => ({
            ...f,
            url: f.path
        }));

        return NextResponse.json(change);
    } catch (error) {
        console.error("Error fetching change:", error);
        return NextResponse.json(
            { error: "Error fetching change" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; changeId: string }> }
) {
    try {
        const { changeId } = await params;
        const id = parseInt(changeId);
        const body = await request.json();

        // Check exists
        const existing = await db.query.changes.findFirst({
            where: eq(changes.id, id),
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Change not found" },
                { status: 404 }
            );
        }

        const updatedChange = await db
            .update(changes)
            .set({
                changeDate: body.change_date,
                changeTypeId: body.change_type_id ? parseInt(body.change_type_id) : existing.changeTypeId,
                requestedBy: body.requested_by,
                description: body.description,
                budgetImpactId: body.budget_impact_id ? parseInt(body.budget_impact_id) : null,
                statusId: body.status_id ? parseInt(body.status_id) : null,
                approvedBy: body.approved_by && body.approved_by !== "none" ? body.approved_by : null,
                internalNotes: body.internal_notes,
            })
            .where(eq(changes.id, id))
            .returning();

        if (body.pending_file_ids && body.pending_file_ids.length > 0) {
            for (const fileId of body.pending_file_ids) {
                await db.insert(filesLinks).values({
                    fileId: parseInt(fileId),
                    fileableId: id,
                    fileableType: 'App\\Models\\WorksiteChange',
                }).onDuplicateKeyUpdate({ set: { id: sql`id` } });
            }
        }

        return NextResponse.json(updatedChange[0]);

    } catch (error) {
        console.error("Error updating change:", error);
        return NextResponse.json(
            { error: "Error updating change" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; changeId: string }> }
) {
    try {
        const { changeId } = await params;
        const id = parseInt(changeId);

        await db.delete(changes).where(eq(changes.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting change:", error);
        return NextResponse.json(
            { error: "Error deleting change" },
            { status: 500 }
        );
    }
}
