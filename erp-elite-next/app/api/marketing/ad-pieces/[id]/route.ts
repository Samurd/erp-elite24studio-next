import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adpieces } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);

        const item = await db.query.adpieces.findFirst({
            where: eq(adpieces.id, id),
            with: {
                type: true,
                format: true,
                status: true,
                project: true,
                team: true,
                strategy: true,
            }
        });

        if (!item) {
            return NextResponse.json({ error: "Ad Piece not found" }, { status: 404 });
        }

        // Fetch associated files
        const { getFilesForModel } = await import("@/actions/files");
        const associatedFiles = await getFilesForModel("App\\Models\\Adpiece", id);

        const itemWithFiles = {
            ...item,
            files: associatedFiles
        };

        return NextResponse.json(itemWithFiles);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        const body = await request.json();

        await db.update(adpieces).set({
            name: body.name,
            media: body.media || null,
            instructions: body.instructions || null,
            typeId: body.type_id ? parseInt(body.type_id) : null,
            formatId: body.format_id ? parseInt(body.format_id) : null,
            statusId: body.status_id ? parseInt(body.status_id) : null,
            projectId: body.project_id ? parseInt(body.project_id) : null,
            teamId: body.team_id ? parseInt(body.team_id) : null,
            strategyId: body.strategy_id ? parseInt(body.strategy_id) : null,
            updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
        }).where(eq(adpieces.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating marketing ad piece:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        await db.delete(adpieces).where(eq(adpieces.id, id));
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
