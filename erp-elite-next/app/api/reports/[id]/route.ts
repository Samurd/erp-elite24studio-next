import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reports, tags } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: paramId } = await params;
        const id = parseInt(paramId);
        const report = await db.select({
            id: reports.id,
            title: reports.title,
            description: reports.description,
            date: reports.date,
            hour: reports.hour,
            statusId: reports.statusId,
            status: {
                id: tags.id,
                name: tags.id // Just need ID/name really
            },
            notes: reports.notes,
            createdAt: reports.createdAt
        })
            .from(reports)
            .leftJoin(tags, eq(reports.statusId, tags.id))
            .where(eq(reports.id, id))
            .limit(1);

        if (report.length === 0) {
            return NextResponse.json({ error: "Report not found" }, { status: 404 });
        }

        // Remap for frontend consistency if needed, but returning flat object is okay
        // Just note that currently `status` is nested object in GET /api/reports
        // Here spread it to match expected prop shape in form if needed, 
        // but typically form expects flat values for fields.

        const { getFilesForModel } = await import("@/actions/files")
        const files = await getFilesForModel("App\\Models\\Report", id)

        return NextResponse.json({ ...report[0], files });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: paramId } = await params;
        const id = parseInt(paramId);
        const body = await req.json();

        await db.update(reports)
            .set({
                title: body.title,
                description: body.description,
                date: body.date,
                hour: body.hour,
                statusId: body.status_id ? parseInt(body.status_id) : null,
                notes: body.notes,
            })
            .where(eq(reports.id, id));

        return NextResponse.json({ message: "Report updated successfully" });
    } catch (error: any) {
        console.error("Error updating report:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: paramId } = await params;
        const id = parseInt(paramId);
        await db.delete(reports).where(eq(reports.id, id));
        return NextResponse.json({ message: "Report deleted successfully" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
