
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { kits } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DateService } from "@/lib/date-service";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) return new NextResponse("Unauthorized", { status: 401 });
        const { id } = await params;

        const kit = await db.query.kits.findFirst({
            where: eq(kits.id, parseInt(id)),
            with: {
                requestedByUser: true,
                deliveryResponsibleUser: true,
                status: true,
            },
        });

        if (!kit) return new NextResponse("Kit not found", { status: 404 });

        return NextResponse.json(kit);
    } catch (error) {
        console.error("Error fetching kit:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) return new NextResponse("Unauthorized", { status: 401 });
        const { id } = await params;

        const body = await request.json();

        await db.update(kits).set({
            recipientName: body.recipient_name,
            recipientRole: body.recipient_role,
            positionArea: body.position_area,
            kitType: body.kit_type,
            kitContents: body.kit_contents,
            requestDate: DateService.toDB(DateService.parseToDate(body.request_date)),
            deliveryDate: body.delivery_date ? DateService.toDB(DateService.parseToDate(body.delivery_date)) : null,
            statusId: body.status_id ? parseInt(body.status_id) : null,
            deliveryResponsibleUserId: body.delivery_responsible_user_id || null,
            observations: body.observations,
        }).where(eq(kits.id, parseInt(id)));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating kit:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) return new NextResponse("Unauthorized", { status: 401 });
        const { id } = await params;

        await db.delete(kits).where(eq(kits.id, parseInt(id)));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting kit:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
