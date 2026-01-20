import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calendarEvents } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const { id } = await params;
    const eventId = parseInt(id);

    try {
        const body = await req.json();

        // Verify ownership
        const existingEvent = await db.select().from(calendarEvents)
            .where(and(eq(calendarEvents.id, eventId), eq(calendarEvents.userId, userId)))
            .limit(1);

        if (existingEvent.length === 0) {
            return NextResponse.json({ error: "Event not found or unauthorized" }, { status: 404 });
        }

        await db.update(calendarEvents).set({
            title: body.title,
            description: body.description,
            startDate: body.start, // FullCalendar sends ISO
            endDate: body.end || null,
            isAllDay: body.is_all_day !== undefined ? (body.is_all_day ? 1 : 0) : undefined,
            color: body.color,
        }).where(eq(calendarEvents.id, eventId));

        return NextResponse.json({ message: "Event updated" });

    } catch (error: any) {
        console.error("Error updating event:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const { id } = await params;
    const eventId = parseInt(id);

    try {
        // Verify ownership
        const existingEvent = await db.select().from(calendarEvents)
            .where(and(eq(calendarEvents.id, eventId), eq(calendarEvents.userId, userId)))
            .limit(1);

        if (existingEvent.length === 0) {
            return NextResponse.json({ error: "Event not found or unauthorized" }, { status: 404 });
        }

        await db.delete(calendarEvents).where(eq(calendarEvents.id, eventId));

        return NextResponse.json({ message: "Event deleted" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
