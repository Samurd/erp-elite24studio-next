
import { db } from "@/lib/db";
import { visits, files, filesLinks } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; visitId: string }> }
) {
    try {
        const { visitId } = await params;
        const id = parseInt(visitId);

        const visit = await db.query.visits.findFirst({
            where: eq(visits.id, id),
            with: {
                status: true,
                visitor: true,
            },
        });

        if (!visit) {
            return NextResponse.json(
                { error: "Visit not found" },
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
                eq(filesLinks.fileableType, 'App\\Models\\WorksiteVisit'),
                eq(filesLinks.fileableId, id)
            ));

        (visit as any).files = associatedFiles.map(f => ({
            ...f,
            url: f.path
        }));

        return NextResponse.json(visit);
    } catch (error) {
        console.error("Error fetching visit:", error);
        return NextResponse.json(
            { error: "Error fetching visit" },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; visitId: string }> }
) {
    try {
        const { visitId } = await params;
        const id = parseInt(visitId);
        const body = await req.json();

        // Validate required fields
        if (!body.visit_date) {
            return NextResponse.json(
                { error: "Date is required" },
                { status: 400 }
            );
        }

        const updatedVisit = await db
            .update(visits)
            .set({
                visitDate: body.visit_date,
                performedBy: body.performed_by && body.performed_by !== "none" ? body.performed_by : null,
                statusId: body.status_id && body.status_id !== "none" ? parseInt(body.status_id) : null,
                generalObservations: body.general_observations || null,
                internalNotes: body.internal_notes || null,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(visits.id, id))
            .returning();

        if (body.pending_file_ids && body.pending_file_ids.length > 0) {
            for (const fileId of body.pending_file_ids) {
                await db.insert(filesLinks).values({
                    fileId: parseInt(fileId),
                    fileableId: id,
                    fileableType: 'App\\Models\\WorksiteVisit',
                }).onConflictDoNothing({
                    target: [filesLinks.fileId, filesLinks.fileableId, filesLinks.fileableType]
                });
            }
        }

        return NextResponse.json(updatedVisit[0]);

    } catch (error) {
        console.error("Error updating visit:", error);
        return NextResponse.json(
            { error: "Error updating visit" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; visitId: string }> }
) {
    try {
        const { visitId } = await params;
        const id = parseInt(visitId);

        await db.delete(visits).where(eq(visits.id, id));

        return NextResponse.json({ message: "Visit deleted successfully" });
    } catch (error) {
        console.error("Error deleting visit:", error);
        return NextResponse.json(
            { error: "Error deleting visit" },
            { status: 500 }
        );
    }
}
