import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { tasks: orderedTasks } = await req.json();
        // Expected format: { tasks: [{ id: 1, order: 0, bucketId: 2 }, ...] }
        // Or simply strict order for a single bucket?
        // Better to handle batch updates including bucket changes if needed.
        // For dnd-kit, usually we send the whole new state of the affected container(s).

        // Let's assume we send an array of updates: { id, order, bucketId }

        if (!Array.isArray(orderedTasks)) {
            return new NextResponse("Invalid data", { status: 400 });
        }

        const promises = orderedTasks.map((task: any) => {
            return db.update(tasks)
                .set({
                    order: task.order,
                    bucketId: task.bucketId
                })
                .where(eq(tasks.id, task.id));
        });

        await Promise.all(promises);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error reordering tasks:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
