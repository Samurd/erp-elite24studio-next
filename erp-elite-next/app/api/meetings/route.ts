import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { meetings, meetingResponsibles } from "@/drizzle/schema";
import { eq, and, desc, gte, lte, like, or, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search");
        const status = searchParams.get("status_filter");
        const team = searchParams.get("team_filter");
        const goal = searchParams.get("goal_filter");
        const dateFrom = searchParams.get("date_from");
        const dateTo = searchParams.get("date_to");

        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("perPage") || "10");
        const offset = (page - 1) * pageSize;

        // Build Where Clause
        const filters = [];

        if (search) {
            filters.push(or(
                like(meetings.title, `%${search}%`),
                like(meetings.notes, `%${search}%`),
                like(meetings.observations, `%${search}%`)
            ));
        }

        if (status && status !== 'all') {
            filters.push(eq(meetings.statusId, parseInt(status)));
        }

        if (team && team !== 'all') {
            filters.push(eq(meetings.teamId, parseInt(team)));
        }

        if (goal !== null && goal !== undefined && goal !== "" && goal !== 'all') {
            filters.push(eq(meetings.goal, goal === '1' ? 1 : 0));
        }

        if (dateFrom) {
            filters.push(gte(meetings.date, dateFrom));
        }

        if (dateTo) {
            filters.push(lte(meetings.date, dateTo));
        }

        const whereClause = filters.length > 0 ? and(...filters) : undefined;

        // Count Total
        const totalResult = await db.select({ count: sql`count(*)` })
            .from(meetings)
            .where(whereClause);
        const total = Number(totalResult[0]?.count || 0);

        // Fetch Data
        const data = await db.query.meetings.findMany({
            where: whereClause,
            limit: pageSize,
            offset: offset,
            orderBy: [desc(meetings.date), desc(meetings.startTime)],
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

        // Flatten Reponsibles for easier frontend consumption
        const formattedData = data.map(meeting => ({
            ...meeting,
            status: meeting.tag,
            responsibles: meeting.meetingResponsibles.map(mr => mr.user)
        }));

        return NextResponse.json({
            data: formattedData,
            meta: {
                total,
                page,
                pageSize,
                lastPage: Math.ceil(total / pageSize)
            }
        });

    } catch (error: any) {
        console.error("Error listing meetings:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        // Validation
        if (!body.title || !body.date || !body.start_time || !body.end_time) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Insert Meeting
        const [insertedMeeting] = await db.insert(meetings).values({
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
        }).returning({ id: meetings.id });

        const meetingId = insertedMeeting.id;

        // Insert Responsibles
        if (body.responsibles && Array.isArray(body.responsibles) && body.responsibles.length > 0) {
            const responsibleValues = body.responsibles
                .filter((userId: any) => userId && userId !== 'NaN' && !Number.isNaN(userId))
                .map((userId: string) => ({
                    meetingId: meetingId,
                    userId: userId,
                }));

            if (responsibleValues.length > 0) {
                await db.insert(meetingResponsibles).values(responsibleValues);
            }
        }

        return NextResponse.json({ id: meetingId, message: "Meeting created" }, { status: 201 });

    } catch (error: any) {
        console.error("Error creating meeting:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
