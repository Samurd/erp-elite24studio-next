import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { strategies, files, filesLinks } from "@/drizzle/schema";
import { eq, or, and } from "drizzle-orm";
import { getFilesForModel, attachFileToModel } from "@/actions/files";
import { StorageService } from "@/lib/storage-service";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        const strategy = await db.query.strategies.findFirst({
            where: eq(strategies.id, id),
            with: {
                status: true,
                responsible: true,
            }
        });

        if (!strategy) {
            return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
        }

        const rawFiles = await db
            .select({
                id: files.id,
                name: files.name,
                path: files.path,
                mimeType: files.mimeType,
                size: files.size,
                disk: files.disk,
                createdAt: files.createdAt,
            })
            .from(files)
            .innerJoin(filesLinks, eq(files.id, filesLinks.fileId))
            .where(and(
                eq(filesLinks.fileableId, id),
                or(
                    eq(filesLinks.fileableType, 'App\\Models\\Strategy'),
                    eq(filesLinks.fileableType, 'App\\\\Models\\\\Strategy')
                )
            ));

        const associatedFiles = await Promise.all(rawFiles.map(async (f) => ({
            ...f,
            url: await StorageService.getUrl(f.path)
        })));
        console.log(`[StrategyAPI] Fetched files for Strategy ${id}:`, associatedFiles.length);

        return NextResponse.json({
            ...strategy,
            files: associatedFiles
        });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        const body = await request.json();

        await db.update(strategies).set({
            name: body.name,
            objective: body.objective,
            statusId: body.status_id ? parseInt(body.status_id) : null,
            startDate: body.start_date || null,
            endDate: body.end_date || null,
            targetAudience: body.target_audience,
            platforms: body.platforms,
            responsibleId: body.responsible_id || null,
            notifyTeam: body.notify_team ? 1 : 0,
            addToCalendar: body.add_to_calendar ? 1 : 0,
            observations: body.observations,
            updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
        }).where(eq(strategies.id, id));

        if (body.pending_file_ids && body.pending_file_ids.length > 0) {
            for (const fileId of body.pending_file_ids) {
                await attachFileToModel(fileId, 'App\\Models\\Strategy', id);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating strategy:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        await db.delete(strategies).where(eq(strategies.id, id));
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
