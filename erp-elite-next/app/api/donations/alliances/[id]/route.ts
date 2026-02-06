import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { alliances, files, filesLinks } from "@/drizzle/schema";
import { eq, and, or } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const allianceId = parseInt(id);

        const alliance = await db.query.alliances.findFirst({
            where: eq(alliances.id, allianceId),
            with: {
                type: true,
            }
        });

        if (!alliance) {
            return NextResponse.json({ error: "Alliance not found" }, { status: 404 });
        }

        // Fetch associated files directly to support multiple model type formats
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
                eq(filesLinks.fileableId, allianceId),
                or(
                    eq(filesLinks.fileableType, 'App\\Models\\Alliance'),
                    eq(filesLinks.fileableType, 'AppModelsAlliance')
                )
            ));

        const { StorageService } = await import("@/lib/storage-service");
        const associatedFiles = await Promise.all(rawFiles.map(async (f) => ({
            ...f,
            url: await StorageService.getUrl(f.path)
        })));

        return NextResponse.json({
            ...alliance,
            files: associatedFiles
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const allianceId = parseInt(id);
        const body = await req.json();

        await db.update(alliances).set({
            name: body.name,
            typeId: body.type_id ? parseInt(body.type_id) : null,
            startDate: body.start_date,
            validity: body.validity ? parseInt(body.validity) : null,
            certified: !!body.certified,
        }).where(eq(alliances.id, allianceId));

        return NextResponse.json({ message: "Alliance updated" });
    } catch (error: any) {
        console.error("Error updating alliance:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const allianceId = parseInt(id);

        await db.delete(alliances).where(eq(alliances.id, allianceId));

        return NextResponse.json({ message: "Alliance deleted" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
