import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks, users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { format } from "date-fns";

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // Lookup corresponding user in Laravel users table by email
    let user = await db.query.users.findFirst({
        where: eq(users.email, session.user.email)
    });

    if (!user) {
        user = await db.query.users.findFirst();
    }

    if (!user) {
        return new NextResponse("No users found in legacy system", { status: 404 });
    }

    const userId = user.id;

    try {
        const body = await req.json();
        const { bucket_id, title, notes, status_id, priority_id, start_date, due_date, order } = body;

        if (!bucket_id || !title) {
            return new NextResponse("Bucket ID and Title are required", { status: 400 });
        }

        const [newTask] = await db.insert(tasks).values({
            bucketId: bucket_id,
            title,
            notes,
            statusId: status_id || null, // Assuming 0 or empty string means null
            priorityId: priority_id || null,
            order: order ?? 9999,
            createdBy: userId,
            startDate: start_date || null,
            dueDate: due_date || null,
            createdAt: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
            updatedAt: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
        }).returning({ id: tasks.id });

        const taskId = newTask.id;

        const task = await db.query.tasks.findFirst({
            where: eq(tasks.id, taskId)
        });

        return NextResponse.json(task);

    } catch (error) {
        console.error("Error creating task:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
