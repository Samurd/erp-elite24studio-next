
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { offBoardingTasks } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { taskId } = await params;

        // Get current task state to toggle
        const currentTask = await db.query.offBoardingTasks.findFirst({
            where: eq(offBoardingTasks.id, parseInt(taskId))
        });

        if (!currentTask) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        const newCompletedState = currentTask.completed === 1 ? 0 : 1;
        const completedBy = newCompletedState === 1 ? session.user.id : null;
        const completedAt = newCompletedState === 1 ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;

        await db.update(offBoardingTasks).set({
            completed: newCompletedState,
            completedBy: completedBy || null,
            completedAt: completedAt,
            updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        }).where(eq(offBoardingTasks.id, parseInt(taskId)));

        return NextResponse.json({ message: "Task updated successfully", completed: newCompletedState });

    } catch (error) {
        console.error("Error toggling task:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { taskId } = await params;

        await db.delete(offBoardingTasks).where(eq(offBoardingTasks.id, parseInt(taskId)));

        return NextResponse.json({ message: "Task deleted successfully" });
    } catch (error) {
        console.error("Error deleting task:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
