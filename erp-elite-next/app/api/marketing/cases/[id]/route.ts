import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { caseMarketings } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { DateService } from "@/lib/date-service";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);

        const caseItem = await db.query.caseMarketings.findFirst({
            where: eq(caseMarketings.id, id),
            with: {
                type: true,
                status: true,
                responsible: true,
                project: true,
            }
        });

        if (!caseItem) {
            return NextResponse.json({ error: "Case not found" }, { status: 404 });
        }

        // Fetch associated files
        const { getFilesForModel } = await import("@/actions/files");
        const associatedFiles = await getFilesForModel("App\\Models\\CaseMarketing", id);

        (caseItem as any).files = associatedFiles;

        return NextResponse.json(caseItem);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        const body = await request.json();

        await db.update(caseMarketings).set({
            subject: body.subject,
            mediums: body.mediums || null,
            description: body.description || null,
            date: body.date || null,
            projectId: body.project_id ? parseInt(body.project_id) : null,
            responsibleId: body.responsible_id || null,
            typeId: body.type_id ? parseInt(body.type_id) : null,
            statusId: body.status_id ? parseInt(body.status_id) : null,
            updatedAt: DateService.toISO()
        }).where(eq(caseMarketings.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating marketing case:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        await db.delete(caseMarketings).where(eq(caseMarketings.id, id));
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
