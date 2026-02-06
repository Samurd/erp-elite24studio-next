
import { db } from "@/lib/db";
import { changes, filesLinks } from "@/drizzle/schema";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const worksiteId = parseInt(id);

        const data = await db.query.changes.findMany({
            where: eq(changes.worksiteId, worksiteId),
            with: {
                type: true,
                status: true,
                budgetImpact: true,
                approver: {
                    columns: { id: true, name: true, profilePhotoUrl: true },
                },
            },
            orderBy: [desc(changes.changeDate)],
        });

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching changes:", error);
        return NextResponse.json(
            { error: "Error fetching changes" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const worksiteId = parseInt(id);
        const body = await request.json();

        // Basic validation
        if (!body.change_date || !body.change_type_id || !body.description) {
            return NextResponse.json(
                { error: "Missing required fields (Date, Type, Description)" },
                { status: 400 }
            );
        }

        const newChange = await db.insert(changes).values({
            worksiteId: worksiteId,
            changeDate: body.change_date,
            changeTypeId: parseInt(body.change_type_id),
            requestedBy: body.requested_by,
            description: body.description,
            budgetImpactId: body.budget_impact_id && body.budget_impact_id !== "none" ? parseInt(body.budget_impact_id) : null,
            statusId: body.status_id && body.status_id !== "none" ? parseInt(body.status_id) : null,
            approvedBy: body.approved_by && body.approved_by !== "none" ? body.approved_by : null,
            internalNotes: body.internal_notes,
        }).returning();

        const changeId = newChange[0].id;

        if (body.pending_file_ids && body.pending_file_ids.length > 0) {
            for (const fileId of body.pending_file_ids) {
                await db.insert(filesLinks).values({
                    fileId: parseInt(fileId),
                    fileableId: changeId,
                    fileableType: 'App\\Models\\WorksiteChange',
                }).onConflictDoNothing({
                    target: [filesLinks.fileId, filesLinks.fileableId, filesLinks.fileableType]
                });
            }
        }

        return NextResponse.json(newChange[0]);
    } catch (error) {
        console.error("Error creating change:", error);
        return NextResponse.json(
            { error: "Error creating change" },
            { status: 500 }
        );
    }
}
