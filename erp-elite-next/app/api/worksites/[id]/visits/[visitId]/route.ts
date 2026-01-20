
import { db } from "@/lib/db";
import { visits } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
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
