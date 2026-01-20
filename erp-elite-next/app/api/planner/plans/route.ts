import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { plans, users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { format } from "date-fns";

export async function POST(req: NextRequest) {
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
        console.log("User not found by email, falling back to first user.");
        user = await db.query.users.findFirst();
    }

    if (!user) {
        return new NextResponse("No users found in legacy system", { status: 404 });
    }

    const userId = user.id;

    try {
        const body = await req.json();
        const { name, description, teamId, projectId } = body;

        if (!name) {
            return new NextResponse("Name is required", { status: 400 });
        }

        const [newPlan] = await db.insert(plans).values({
            name,
            description,
            ownerId: userId,
            teamId: teamId || null,
            projectId: projectId || null,
            createdAt: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
            updatedAt: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
        }).returning({ id: plans.id });

        const planId = newPlan.id;

        // Fetch back the new plan
        const plan = await db.query.plans.findFirst({
            where: eq(plans.id, planId),
        });

        return NextResponse.json(plan);

    } catch (error) {
        console.error("Error creating plan:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
