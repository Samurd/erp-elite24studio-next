
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

        // Create and Attach files if pending_file_ids are present
        if (body.pending_file_ids && Array.isArray(body.pending_file_ids) && body.pending_file_ids.length > 0) {
            try {
                const { attachFileToModel } = await import("@/actions/files");
                await Promise.all(body.pending_file_ids.map((fileId: number) =>
                    attachFileToModel(fileId, "App\\Models\\CaseRecord", id)
                ));
            } catch (fileError) {
                console.error("Error attaching files:", fileError);
            }
        }

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
