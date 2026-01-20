import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { folders, files } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
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
        const { type } = body;
        const id = parseInt(params.id);

        if (!type) {
            return NextResponse.json({ error: "Type is required" }, { status: 400 });
        }

        if (type === 'folder') {
            // TODO: Implement recursive deletion or prevent deletion of non-empty folders
            await db.delete(folders).where(eq(folders.id, id));
        } else {
            await db.delete(files).where(eq(files.id, id));
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
