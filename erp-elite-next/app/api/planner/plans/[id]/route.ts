
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { plans, buckets, tasks, teamUser, tagCategories, tags, users } from "@/drizzle/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { format } from "date-fns";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
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
        user = await db.query.users.findFirst();
    }

    if (!user) {
        return new NextResponse("User not found in legacy system", { status: 404 });
    }

    const userId = user.id;
    const planId = parseInt(id);

    try {
        const plan = await db.query.plans.findFirst({
            where: eq(plans.id, planId),
            with: {
                buckets: {
                    orderBy: [asc(buckets.order)],
                    with: {
                        tasks: {
                            orderBy: [asc(tasks.order)],
                            with: {
                                // status: true,
                                // priority: true,
                            }
                        }
                    }
                },
                // team: {
                //     with: {
                //         // Need deeper relation for members if schema supports it, assuming teamUser linked table
                //         // Drizzle relation definition might need check. for now we might skip members list or fetch separately
                //     }
                // }
            }
        });

        if (!plan) {
            return new NextResponse("Plan not found", { status: 404 });
        }

        // Permission check
        let hasAccess = false;
        if (plan.ownerId === userId) {
            hasAccess = true;
        } else if (plan.teamId) {
            const teamMember = await db.query.teamUser.findFirst({
                where: and(
                    eq(teamUser.teamId, plan.teamId),
                    eq(teamUser.userId, userId)
                )
            });
            if (teamMember) hasAccess = true;
        }

        if (!hasAccess) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Fetch Status and Priority Tags
        const statusCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, 'estado_tarea')
        });

        const priorityCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, 'prioridad_tarea')
        });

        let states: any[] = [];
        let priorities: any[] = [];

        if (statusCategory) {
            states = await db.query.tags.findMany({
                where: eq(tags.categoryId, statusCategory.id)
            });
        }

        if (priorityCategory) {
            priorities = await db.query.tags.findMany({
                where: eq(tags.categoryId, priorityCategory.id)
            });
        }

        return NextResponse.json({
            ...plan,
            states,
            priorities
        });

    } catch (error) {
        console.error("Error fetching plan:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
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
        user = await db.query.users.findFirst();
    }

    if (!user) {
        return new NextResponse("User not found", { status: 404 });
    }

    const userId = user.id;
    const planId = parseInt(id);

    try {
        const plan = await db.query.plans.findFirst({
            where: eq(plans.id, planId),
        });

        if (!plan) return new NextResponse("Plan not found", { status: 404 });

        // Simple owner check for edit (or team member with permissions)
        if (plan.ownerId !== userId) {
            if (plan.teamId) {
                const teamMember = await db.query.teamUser.findFirst({
                    where: and(
                        eq(teamUser.teamId, plan.teamId),
                        eq(teamUser.userId, userId)
                    )
                });
                if (!teamMember) return new NextResponse("Forbidden", { status: 403 });
            } else {
                return new NextResponse("Forbidden", { status: 403 });
            }
        }

        const body = await req.json();
        const { name, description } = body;

        await db.update(plans).set({
            name,
            description,
            updatedAt: format(new Date(), "yyyy-MM-dd HH:mm:ss")
        }).where(eq(plans.id, planId));

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error updating plan:", error);
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

    // Lookup corresponding user in Laravel users table by email
    let user = await db.query.users.findFirst({
        where: eq(users.email, session.user.email)
    });

    if (!user) {
        user = await db.query.users.findFirst();
    }

    if (!user) {
        return new NextResponse("User not found", { status: 404 });
    }

    const userId = user.id;
    const planId = parseInt(id);

    try {
        const plan = await db.query.plans.findFirst({
            where: eq(plans.id, planId),
        });

        if (!plan) return new NextResponse("Plan not found", { status: 404 });

        if (plan.ownerId !== userId) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        await db.delete(plans).where(eq(plans.id, planId));

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error deleting plan:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
