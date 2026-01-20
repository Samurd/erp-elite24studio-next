import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { licenses, files, filesLinks } from "@/drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const licenseId = parseInt(id);

        const license = await db.query.licenses.findFirst({
            where: eq(licenses.id, licenseId),
            with: {
                licenseType: true,
                status: true,
                project: true,
            }
        });

        if (!license) {
            return NextResponse.json({ error: "License not found" }, { status: 404 });
        }

        const { getFilesForModel } = await import("@/actions/files")
        const associatedFiles = await getFilesForModel("App\\Models\\License", licenseId);

        (license as any).files = associatedFiles

        return NextResponse.json(license);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const licenseId = parseInt(id);
        const body = await req.json();

        await db.update(licenses).set({
            projectId: parseInt(body.project_id),
            licenseTypeId: parseInt(body.license_type_id),
            statusId: body.status_id ? parseInt(body.status_id) : null,
            entity: body.entity,
            company: body.company,
            eradicatedNumber: body.eradicated_number,
            eradicatdDate: body.eradicatd_date || null,
            estimatedApprovalDate: body.estimated_approval_date || null,
            expirationDate: body.expiration_date || null,
            requiresExtension: body.requires_extension ? 1 : 0,
            observations: body.observations,
        }).where(eq(licenses.id, licenseId));

        if (body.pending_file_ids && Array.isArray(body.pending_file_ids)) {
            const { attachFileToModel } = await import("@/actions/files")
            for (const fileId of body.pending_file_ids) {
                await attachFileToModel(fileId, "App\\Models\\License", licenseId);
            }
        }

        return NextResponse.json({ message: "License updated" });
    } catch (error: any) {
        console.error("Error updating license:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const licenseId = parseInt(id);

        await db.delete(licenses).where(eq(licenses.id, licenseId));

        return NextResponse.json({ message: "License deleted" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
