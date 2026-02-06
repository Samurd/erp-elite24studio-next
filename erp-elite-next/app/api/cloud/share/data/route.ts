import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { users, teams, shares } from "@/drizzle/schema";
import { eq, and, isNotNull, isNull, ne } from "drizzle-orm";

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const type = req.nextUrl.searchParams.get("type");
    const id = req.nextUrl.searchParams.get("id");

    if (!type || !id) {
        return NextResponse.json({ error: "Type and ID required" }, { status: 400 });
    }

    try {
        const modelType = type === 'folder' ? 'App\\\\Models\\\\Folder' : 'App\\\\Models\\\\File';

        // Get all users except current user
        const allUsers = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email
            })
            .from(users)
            .where(ne(users.id, session.user.id));

        // Get all teams
        const allTeams = await db
            .select({
                id: teams.id,
                name: teams.name
            })
            .from(teams);

        // Get existing shares (non-public)
        const existingShares = await db.query.shares.findMany({
            where: and(
                eq(shares.shareableType, modelType),
                eq(shares.shareableId, parseInt(id)),
                isNull(shares.shareToken)
            ),
            with: {
                user_sharedWithUserId: {
                    columns: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                team: {
                    columns: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        // Get public link
        const [publicLinkData] = await db
            .select()
            .from(shares)
            .where(
                and(
                    eq(shares.shareableType, modelType),
                    eq(shares.shareableId, parseInt(id)),
                    isNotNull(shares.shareToken)
                )
            )
            .limit(1);

        let publicLink = null;
        if (publicLinkData) {
            // Check if expired
            if (publicLinkData.expiresAt && new Date(publicLinkData.expiresAt) < new Date()) {
                // Delete expired link
                await db.delete(shares).where(eq(shares.id, publicLinkData.id));
            } else {
                publicLink = {
                    url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.FRONTEND_DOMAIN || 'http://localhost:3000'}/s/share/${publicLinkData.shareToken}`,
                    expires_at: publicLinkData.expiresAt,
                    token: publicLinkData.shareToken
                };
            }
        }

        return NextResponse.json({
            users: allUsers,
            teams: allTeams,
            shares: existingShares,
            publicLink
        });
    } catch (error) {
        console.error("Error fetching share data:", error);
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}
