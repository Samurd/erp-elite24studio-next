import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { shares } from "@/drizzle/schema";
import { and, eq, isNotNull } from "drizzle-orm";
import { randomBytes } from "crypto";

function generateToken(length: number = 40): string {
    return randomBytes(length).toString('hex').slice(0, length);
}

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { type, id, expires_at } = body;

        if (!type || !id) {
            return NextResponse.json({ error: "Type and ID required" }, { status: 400 });
        }

        const modelType = type === 'folder' ? 'App\\\\Models\\\\Folder' : 'App\\\\Models\\\\File';
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const token = generateToken(40);

        // Delete existing public link
        await db.delete(shares).where(
            and(
                eq(shares.shareableType, modelType),
                eq(shares.shareableId, parseInt(id)),
                isNotNull(shares.shareToken)
            )
        );

        // Create new public link
        await db.insert(shares).values({
            userId: session.user.id,
            shareableType: modelType,
            shareableId: parseInt(id),
            sharedWithUserId: null,
            sharedWithTeamId: null,
            permission: 'view',
            shareToken: token,
            expiresAt: expires_at ? new Date(expires_at).toISOString().slice(0, 19).replace('T', ' ') : null,
            createdAt: now,
            updatedAt: now
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error generating public link:", error);
        return NextResponse.json({ error: "Failed to generate link" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { type, id } = body;

        if (!type || !id) {
            return NextResponse.json({ error: "Type and ID required" }, { status: 400 });
        }

        const modelType = type === 'folder' ? 'App\\\\Models\\\\Folder' : 'App\\\\Models\\\\File';

        // Delete public link
        await db.delete(shares).where(
            and(
                eq(shares.shareableType, modelType),
                eq(shares.shareableId, parseInt(id)),
                isNotNull(shares.shareToken)
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting public link:", error);
        return NextResponse.json({ error: "Failed to delete link" }, { status: 500 });
    }
}
