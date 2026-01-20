
import { db } from "@/lib/db";
import { worksites } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const worksiteId = parseInt(id);

        const worksite = await db.query.worksites.findFirst({
            where: eq(worksites.id, worksiteId),
            with: {
                project: {
                    columns: { id: true, name: true },
                },
                type: true,
                status: true,
                responsible: {
                    columns: { id: true, name: true, profilePhotoUrl: true },
                },
            },
        });

        if (!worksite) {
            return NextResponse.json(
                { error: "Worksite not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(worksite);
    } catch (error) {
        console.error("Error fetching worksite:", error);
        return NextResponse.json(
            { error: "Error fetching worksite" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const worksiteId = parseInt(id);
        const body = await request.json();

        // Check exists
        const existing = await db.query.worksites.findFirst({
            where: eq(worksites.id, worksiteId),
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Worksite not found" },
                { status: 404 }
            );
        }

        const updatedWorksite = await db
            .update(worksites)
            .set({
                projectId: body.projectId ? parseInt(body.projectId) : existing.projectId,
                name: body.name || existing.name,
                typeId: body.typeId ? parseInt(body.typeId) : null, // Allow clearing via null if passed, logic depends on frontend
                statusId: body.statusId ? parseInt(body.statusId) : null,
                responsibleId: body.responsibleId === "none" ? null : body.responsibleId,
                address: body.address,
                startDate: body.startDate,
                endDate: body.endDate,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(worksites.id, worksiteId))
            .returning();

        return NextResponse.json(updatedWorksite[0]);

    } catch (error) {
        console.error("Error updating worksite:", error);
        return NextResponse.json(
            { error: "Error updating worksite" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const worksiteId = parseInt(id);

        await db.delete(worksites).where(eq(worksites.id, worksiteId));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting worksite:", error);
        return NextResponse.json(
            { error: "Error deleting worksite" },
            { status: 500 }
        );
    }
}
