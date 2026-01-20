import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audits, filesLinks, files } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        const record = await db.query.audits.findFirst({
            where: eq(audits.id, id),
            with: {
                tag_typeId: true,
                tag_statusId: true,
            }
        });

        if (!record) {
            return NextResponse.json({ error: "Audit not found" }, { status: 404 });
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
                eq(filesLinks.fileableType, 'App\\Models\\Audit'),
                eq(filesLinks.fileableId, id)
            ));

        return NextResponse.json({
            ...record,
            type: record.tag_typeId,
            status: record.tag_statusId,
            files: associatedFiles.map(f => ({
                ...f,
                url: f.path
            }))
        });

    } catch (error: any) {
        console.error("Error fetching audit:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        const body = await req.json();

        // Validation
        if (!body.date_register || !body.date_audit || !body.objective || !body.place) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await db.update(audits).set({
            dateRegister: body.date_register,
            dateAudit: body.date_audit,
            objective: Number(body.objective),
            typeId: body.type_id ? parseInt(body.type_id) : null,
            place: body.place,
            statusId: body.status_id ? parseInt(body.status_id) : null,
            observations: body.observations,
        }).where(eq(audits.id, id));

        if (body.pending_file_ids && body.pending_file_ids.length > 0) {
            for (const fileId of body.pending_file_ids) {
                await db.insert(filesLinks).values({
                    fileId: parseInt(fileId),
                    fileableId: id,
                    fileableType: 'App\\Models\\Audit',
                }).onConflictDoNothing();
            }
        }

        return NextResponse.json({ message: "Audit updated" });
    } catch (error: any) {
        console.error("Error updating audit:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        await db.delete(audits).where(eq(audits.id, id));
        return NextResponse.json({ message: "Audit deleted" });
    } catch (error: any) {
        console.error("Error deleting audit:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
