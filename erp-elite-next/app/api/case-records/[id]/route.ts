
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { caseRecords, filesLinks } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = parseInt(params.id);
    const body = await req.json();
    const {
        date,
        channel,
        case_type_id,
        status_id,
        assigned_to_id,
        contact_id,
        description
    } = body;

    try {
        await db.update(caseRecords)
            .set({
                date: date,
                channel: channel,
                caseTypeId: case_type_id,
                statusId: status_id,
                assignedToId: assigned_to_id,
                contactId: contact_id,
                description: description,
                // updatedAt is handled automatically or by default
            })
            .where(eq(caseRecords.id, id));

        // Note: File attachments updates usually happen via separate endpoints or the 'files' array logic.
        // In the Vue 'Form.vue', it seems attachments are handled by `ModelAttachments` which hits its own endpoints,
        // OR `files` array is passed. 
        // For 'update', `ModelAttachments` component handles uploads/detaches directly.
        // So we don't need to handle files array here unless we want to sync.

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating case record:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = parseInt(params.id);

    try {
        // Soft delete logic? Schema has deletedAt?
        // Checked schema: `deletedAt: timestamp("deleted_at", ...)` exists.

        await db.update(caseRecords)
            .set({ deletedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') })
            .where(eq(caseRecords.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting case record:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
