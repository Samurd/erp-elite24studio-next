import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { taxRecords, filesLinks, files, tags } from "@/drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        const record = await db.query.taxRecords.findFirst({
            where: eq(taxRecords.id, id),
            with: {
                tag_typeId: true,
                tag_statusId: true,
            }
        });

        if (!record) {
            return NextResponse.json({ error: "Tax record not found" }, { status: 404 });
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
                eq(filesLinks.fileableType, 'App\\Models\\TaxRecord'),
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
        console.error("Error fetching tax record:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        const body = await req.json();

        // Validation
        if (!body.entity || !body.base || !body.porcentage || !body.amount || !body.date) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await db.update(taxRecords).set({
            typeId: body.type_id ? parseInt(body.type_id) : null,
            statusId: body.status_id ? parseInt(body.status_id) : null,
            entity: body.entity,
            base: Number(body.base),
            porcentage: Number(body.porcentage),
            amount: Number(body.amount),
            date: body.date,
            observations: body.observations,
        }).where(eq(taxRecords.id, id));

        if (body.pending_file_ids && body.pending_file_ids.length > 0) {
            for (const fileId of body.pending_file_ids) {
                await db.insert(filesLinks).values({
                    fileId: parseInt(fileId),
                    fileableId: id,
                    fileableType: 'App\\Models\\TaxRecord',
                }).onConflictDoNothing();
            }
        }

        return NextResponse.json({ message: "Tax record updated" });
    } catch (error: any) {
        console.error("Error updating tax record:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        await db.delete(taxRecords).where(eq(taxRecords.id, id));
        return NextResponse.json({ message: "Tax record deleted" });
    } catch (error: any) {
        console.error("Error deleting tax record:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
