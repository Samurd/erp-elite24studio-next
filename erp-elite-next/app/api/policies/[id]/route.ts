import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { policies, files, filesLinks } from "@/drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const policyId = parseInt(id);

        const policy = await db.query.policies.findFirst({
            where: eq(policies.id, policyId),
            with: {
                type: true,
                status: true,
                assignedTo: true,
                // Files not included in relation yet, frontend fetches via ModelAttachments usually?
                // actually ModelAttachments fetches by itself if we pass modelId/Type.
                // But for Show mode, we might want to list them.
                // ModelAttachments component handles fetching if we don't pass `initialFiles`.
                // But Show.vue passed `policy.files`.
                // I'll assume for Show mode we might need a separate fetch or rely on client side fetching if possible, 
                // BUT `ModelAttachments` doesn't seem to have a "readonly/view" mode that lists files nicely without edit controls easily?
                // Actually `ModelAttachments` has `handleDetach` etc.
                // I might need a "ReadOnlyAttachments" component or just use ModelAttachments with disabled controls?
                // For now, standard GET.
            }
        });

        if (!policy) {
            return NextResponse.json({ error: "Policy not found" }, { status: 404 });
        }

        const { getFilesForModel } = await import("@/actions/files")
        const associatedFiles = await getFilesForModel("App\\Models\\Policy", policyId);

        (policy as any).files = associatedFiles

        return NextResponse.json(policy);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const policyId = parseInt(id);
        const body = await req.json();

        await db.update(policies).set({
            name: body.name,
            typeId: parseInt(body.type_id),
            statusId: body.status_id ? parseInt(body.status_id) : null,
            assignedToId: body.assigned_to_id || null, // UUID, do not parseInt
            issuedAt: body.issued_at || null,
            reviewedAt: body.reviewed_at ? body.reviewed_at : null,
            description: body.description,
        }).where(eq(policies.id, policyId));

        if (body.pending_file_ids && Array.isArray(body.pending_file_ids)) {
            const { attachFileToModel } = await import("@/actions/files")
            for (const fileId of body.pending_file_ids) {
                await attachFileToModel(fileId, "App\\Models\\Policy", policyId);
            }
        }

        return NextResponse.json({ message: "Policy updated" });
    } catch (error: any) {
        console.error("Error updating policy:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const policyId = parseInt(id);

        await db.delete(policies).where(eq(policies.id, policyId));

        return NextResponse.json({ message: "Policy deleted" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
