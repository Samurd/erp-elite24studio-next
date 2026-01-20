import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { certificates, files, filesLinks } from "@/drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const certificateId = parseInt(id);

        const certificate = await db.query.certificates.findFirst({
            where: eq(certificates.id, certificateId),
            with: {
                type: true,
                status: true,
                assignedTo: true,
            }
        });

        if (!certificate) {
            return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
        }

        const { getFilesForModel } = await import("@/actions/files")
        const associatedFiles = await getFilesForModel("App\\Models\\Certificate", certificateId);

        (certificate as any).files = associatedFiles

        return NextResponse.json(certificate);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const certificateId = parseInt(id);
        const body = await req.json();

        await db.update(certificates).set({
            name: body.name,
            typeId: parseInt(body.type_id),
            statusId: body.status_id ? parseInt(body.status_id) : null,
            assignedToId: body.assigned_to_id || null, // UUID, do not parseInt
            issuedAt: body.issued_at || null,
            expiresAt: body.expires_at || null,
            description: body.description,
        }).where(eq(certificates.id, certificateId));

        if (body.pending_file_ids && Array.isArray(body.pending_file_ids)) {
            const { attachFileToModel } = await import("@/actions/files")
            for (const fileId of body.pending_file_ids) {
                await attachFileToModel(fileId, "App\\Models\\Certificate", certificateId);
            }
        }

        return NextResponse.json({ message: "Certificate updated" });
    } catch (error: any) {
        console.error("Error updating certificate:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const certificateId = parseInt(id);

        await db.delete(certificates).where(eq(certificates.id, certificateId));

        return NextResponse.json({ message: "Certificate deleted" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
