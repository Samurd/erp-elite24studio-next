import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { meetings, meetingResponsibles } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const meetingId = parseInt(id);

        const meeting = await db.query.meetings.findFirst({
            where: eq(meetings.id, meetingId),
            with: {
                tag: true,
                team: true,
                meetingResponsibles: {
                    with: {
                        user: true
                    }
                }
            }
        });

        if (!meeting) {
            return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
        }

        // Format Responsibles
        const formattedData = {
            ...meeting,
            status: meeting.tag,
            responsibles: meeting.meetingResponsibles.map(mr => mr.user)
        };

        return NextResponse.json(formattedData);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const meetingId = parseInt(id);
        const body = await req.json();

        // Validation
        if (!body.title || !body.date || !body.start_time || !body.end_time) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Update Meeting
        await db.update(meetings).set({
            title: body.title,
            date: body.date,
            startTime: body.start_time,
            endTime: body.end_time,
            teamId: body.team_id ? parseInt(body.team_id) : null,
            statusId: body.status_id ? parseInt(body.status_id) : null,
            notes: body.notes,
            observations: body.observations,
            url: body.url,
            goal: body.goal ? 1 : 0,
        }).where(eq(meetings.id, meetingId));

        // Sync Responsibles (Delete all and re-insert)
        // Note: Using a transaction would be better but keeping it simple for now as per other routes
        await db.delete(meetingResponsibles).where(eq(meetingResponsibles.meetingId, meetingId));

        if (body.responsibles && Array.isArray(body.responsibles) && body.responsibles.length > 0) {
            const responsibleValues = body.responsibles.map((userId: number) => ({
                meetingId: meetingId,
                userId: userId,
            }));
            await db.insert(meetingResponsibles).values(responsibleValues);
        }

        return NextResponse.json({ message: "Meeting updated" });

    } catch (error: any) {
        console.error("Error updating meeting:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const meetingId = parseInt(id);

        await db.delete(meetings).where(eq(meetings.id, meetingId));

        return NextResponse.json({ message: "Meeting deleted" });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
