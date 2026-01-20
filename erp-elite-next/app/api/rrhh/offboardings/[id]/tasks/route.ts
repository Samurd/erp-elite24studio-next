
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { offBoardingTasks } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        if (!body.content) {
            return NextResponse.json(
                { error: "Content is required" },
                { status: 400 }
            );
        }

        const newTask = await db.insert(offBoardingTasks).values({
            offBoardingId: parseInt(id),
            content: body.content,
            teamId: (body.team_id && body.team_id !== "null") ? parseInt(body.team_id) : null,
            completed: 0,
            createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
            updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        }).returning({ id: offBoardingTasks.id });

        return NextResponse.json({ id: newTask[0].id, message: "Task added successfully" }, { status: 201 });

    } catch (error) {
        console.error("Error adding task:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
