import { db } from "@/lib/db";
import { events } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { DateService } from "@/lib/date-service";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const event = await db.query.events.findFirst({
            where: eq(events.id, parseInt(id)),
            with: {
                type: true,
                status: true,
                responsible: true,
            },
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // Fetch associated files
        const { getFilesForModel } = await import("@/actions/files");
        const associatedFiles = await getFilesForModel("App\\Models\\Event", parseInt(id));

        const eventWithFiles = {
            ...event,
            files: associatedFiles
        };

        return NextResponse.json(eventWithFiles);
    } catch (error) {
        console.error("Error fetching event:", error);
        return NextResponse.json(
            { error: "Error fetching event" },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const {
            name,
            type_id,
            event_date,
            location,
            status_id,
            responsible_id,
            observations,
        } = body;

        // Validate
        if (!name || !type_id || !event_date || !status_id || !responsible_id || !location) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await db.update(events)
            .set({
                name,
                typeId: parseInt(type_id),
                eventDate: event_date,
                location,
                statusId: parseInt(status_id),
                responsibleId: responsible_id,
                observations: observations || null,
                updatedAt: DateService.toISO(),
            })
            .where(eq(events.id, parseInt(id)));

        return NextResponse.json({ message: "Evento actualizado exitosamente" });
    } catch (error) {
        console.error("Error updating event:", error);
        return NextResponse.json(
            { error: "Error updating event" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await db.delete(events).where(eq(events.id, parseInt(id)));

        return NextResponse.json({ message: "Evento eliminado exitosamente" });
    } catch (error) {
        console.error("Error deleting event:", error);
        return NextResponse.json(
            { error: "Error deleting event" },
            { status: 500 }
        );
    }
}
