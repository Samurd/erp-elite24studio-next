import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { shares } from "@/drizzle/schema";
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
        const shareId = parseInt(params.id);

        // Delete share
        await db.delete(shares).where(eq(shares.id, shareId));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting share:", error);
        return NextResponse.json({ error: "Failed to delete share" }, { status: 500 });
    }
}
