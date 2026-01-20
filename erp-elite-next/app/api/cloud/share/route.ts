import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { shares } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { type, id, user_id, team_id, permission } = body;

        if (!type || !id || !permission) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (!user_id && !team_id) {
            return NextResponse.json({ error: "Must provide user_id or team_id" }, { status: 400 });
        }

        const modelType = type === 'folder' ? 'App\\\\Models\\\\Folder' : 'App\\\\Models\\\\File';
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // Check if share already exists
        const existingShare = await db.query.shares.findFirst({
            where: and(
                eq(shares.shareableType, modelType),
                eq(shares.shareableId, parseInt(id)),
                user_id ? eq(shares.sharedWithUserId, parseInt(user_id)) : undefined,
                team_id ? eq(shares.sharedWithTeamId, parseInt(team_id)) : undefined
            )
        });

        if (existingShare) {
            // Update existing share
            await db.update(shares)
                .set({
                    permission: permission as 'view' | 'edit',
                    updatedAt: now
                })
                .where(eq(shares.id, existingShare.id));
        } else {
            // Create new share
            await db.insert(shares).values({
                userId: session.user.id,
                shareableType: modelType,
                shareableId: parseInt(id),
                sharedWithUserId: user_id ? parseInt(user_id) : null,
                sharedWithTeamId: team_id ? parseInt(team_id) : null,
                permission: permission as 'view' | 'edit',
                shareToken: null,
                expiresAt: null,
                createdAt: now,
                updatedAt: now
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error creating share:", error);
        return NextResponse.json({ error: "Failed to create share" }, { status: 500 });
    }
}
