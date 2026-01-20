import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { plans, teams, teamUser, users } from "@/drizzle/schema";
import { eq, or, and, desc, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
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
        // Fallback or empty return if user mismatch
        user = await db.query.users.findFirst();
    }

    if (!user) {
        return NextResponse.json({ personalPlans: [], groupPlans: [], myTeams: [] });
    }

    const userId = user.id;

    try {
        // 1. Fetch Personal Plans
        const personalPlans = await db.query.plans.findMany({
            where: eq(plans.ownerId, userId),
            orderBy: [desc(plans.createdAt)],
            with: {
                // team: true,
            }
        });

        // 2. Fetch Group Plans (My Teams)
        // First get user's teams
        const myTeamUsers = await db.select({ teamId: teamUser.teamId }).from(teamUser).where(eq(teamUser.userId, userId));
        const teamIds = myTeamUsers.map(t => t.teamId).filter(Boolean) as number[];

        let groupPlans: typeof personalPlans = [];

        if (teamIds.length > 0) {
            groupPlans = await db.query.plans.findMany({
                where: inArray(plans.teamId, teamIds),
                orderBy: [desc(plans.createdAt)],
                with: {
                    // team: true,
                }
            });
        }

        // 3. Helper data (Teams for creation)
        const myTeams = await db.query.teams.findMany({
            where: inArray(teams.id, teamIds),
        });

        return NextResponse.json({
            personalPlans,
            groupPlans,
            myTeams
        });

    } catch (error) {
        console.error("Error fetching plans:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

