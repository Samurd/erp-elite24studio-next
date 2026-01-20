import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { folders } from "@/drizzle/schema";

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, parent_id } = body;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

        await db.insert(folders).values({
            name,
            parentId: parent_id || null,
            userId: session.user.id,
            createdAt: now,
            updatedAt: now,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error creating folder:", error);
        return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
    }
}
