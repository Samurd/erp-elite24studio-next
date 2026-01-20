import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { format } from "date-fns";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const taskId = parseInt(id);

    try {
        const body = await req.json();
        const { title, notes, status_id, priority_id, start_date, due_date, bucket_id } = body;

        await db.update(tasks).set({
            title,
            notes,
            statusId: status_id || null,
            priorityId: priority_id || null,
            bucketId: bucket_id, // Allow moving task to another bucket via PUT
            startDate: start_date || null,
            dueDate: due_date || null,
            updatedAt: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
        }).where(eq(tasks.id, taskId));

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error updating task:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const taskId = parseInt(id);

    try {
        await db.delete(tasks).where(eq(tasks.id, taskId));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting task:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
