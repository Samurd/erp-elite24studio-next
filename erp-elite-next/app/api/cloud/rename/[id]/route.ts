import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { folders, files } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function PUT(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, type } = body;
        const id = parseInt(params.id);

        if (!name || !type) {
            return NextResponse.json({ error: "Name and type are required" }, { status: 400 });
        }

        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

        if (type === 'folder') {
            await db.update(folders)
                .set({ name, updatedAt: now })
                .where(eq(folders.id, id));
        } else {
            await db.update(files)
                .set({ name, updatedAt: now })
                .where(eq(files.id, id));
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error renaming:", error);
        return NextResponse.json({ error: "Failed to rename" }, { status: 500 });
    }
}
