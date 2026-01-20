import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { alliances } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

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

        const { getFilesForModel } = await import("@/actions/files");
        const files = await getFilesForModel("App\\Models\\Alliance", allianceId);

        return NextResponse.json({
            ...alliance,
            files
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
            certified: body.certified ? 1 : 0,
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
