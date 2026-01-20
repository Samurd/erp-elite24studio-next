
import { db } from "@/lib/db";
import { visits } from "@/drizzle/schema";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const worksiteId = parseInt(id);

        const items = await db.query.visits.findMany({
            where: eq(visits.worksiteId, worksiteId),
            orderBy: [desc(visits.visitDate)],
            with: {
                status: true,
                visitor: true,
            },
        });

        return NextResponse.json(items);
    } catch (error) {
        console.error("Error fetching visits:", error);
        return NextResponse.json(
            { error: "Error fetching visits" },
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
        if (!body.visit_date) {
            return NextResponse.json(
                { error: "Date is required" },
                { status: 400 }
            );
        }

        const newItem = await db
            .insert(visits)
            .values({
                worksiteId,
                visitDate: body.visit_date,
                performedBy: body.performed_by && body.performed_by !== "none" ? body.performed_by : null,
                statusId: body.status_id && body.status_id !== "none" ? parseInt(body.status_id) : null,
                generalObservations: body.general_observations || null,
                internalNotes: body.internal_notes || null,
            })
            .returning();

        return NextResponse.json(newItem[0]);
    } catch (error) {
        console.error("Error creating visit:", error);
        return NextResponse.json(
            { error: "Error creating visit" },
            { status: 500 }
        );
    }
}
