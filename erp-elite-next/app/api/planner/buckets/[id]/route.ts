import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buckets } from "@/drizzle/schema";
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

    const bucketId = parseInt(id);

    try {
        const body = await req.json();
        const { name } = body;

        await db.update(buckets).set({
            name,
            updatedAt: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
        }).where(eq(buckets.id, bucketId));

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error updating bucket:", error);
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

    const bucketId = parseInt(id);

    try {
        await db.delete(buckets).where(eq(buckets.id, bucketId));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting bucket:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
