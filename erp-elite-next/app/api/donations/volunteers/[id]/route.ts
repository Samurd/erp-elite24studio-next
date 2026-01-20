import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { volunteers } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { getFilesForModel } from "@/actions/files";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const volunteerId = parseInt(id);

        const volunteer = await db.query.volunteers.findFirst({
            where: eq(volunteers.id, volunteerId),
            with: {
                campaign: true,
                status: true,
            }
        });

        if (!volunteer) {
            return NextResponse.json({ error: "Volunteer not found" }, { status: 404 });
        }

        const files = await getFilesForModel("App\\Models\\Volunteer", volunteerId);

        return NextResponse.json({ ...volunteer, files });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const volunteerId = parseInt(id);
        const body = await req.json();

        await db.update(volunteers).set({
            name: body.name,
            email: body.email,
            phone: body.phone,
            address: body.address,
            city: body.city,
            state: body.state,
            country: body.country,
            role: body.role,
            campaignId: body.campaign_id ? parseInt(body.campaign_id) : null,
            statusId: body.status_id ? parseInt(body.status_id) : null,
            certified: body.certified ? 1 : 0,
        }).where(eq(volunteers.id, volunteerId));

        return NextResponse.json({ message: "Volunteer updated" });
    } catch (error: any) {
        console.error("Error updating volunteer:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const volunteerId = parseInt(id);

        await db.delete(volunteers).where(eq(volunteers.id, volunteerId));

        return NextResponse.json({ message: "Volunteer deleted" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
