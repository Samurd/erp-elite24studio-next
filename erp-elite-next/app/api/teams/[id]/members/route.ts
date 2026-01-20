import { db } from '@/lib/db';
import { teamUser, users, teamRoles, teams } from '@/drizzle/schema';
import { eq, and, ilike, or, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const teamId = Number(id);

    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');

        let whereClause = eq(teamUser.teamId, teamId);

        if (search) {
            whereClause = and(
                whereClause,
                or(
                    ilike(users.name, `%${search}%`),
                    ilike(users.email, `%${search}%`)
                )
            )!;
        }

        // Fetch all members for team
        // Similar to teams/[id] GET but specialized list
        const membersList = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            image: users.image,
            role: {
                id: teamRoles.id,
                name: teamRoles.name,
                slug: teamRoles.slug
            },
            joinedAt: teamUser.createdAt
        })
            .from(teamUser)
            .innerJoin(users, eq(teamUser.userId, users.id))
            .innerJoin(teamRoles, eq(teamUser.roleId, teamRoles.id))
            .where(whereClause);

        return NextResponse.json(membersList);

    } catch (error) {
        console.error('Error fetching members:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    // Remove member (Kick or Leave)
    const { id } = await params;
    const teamId = Number(id);

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { userId } = body; // User to remove

        // Check Permissions: Only Owner can kick? 
        // Or admin role? For now assume Owner.
        const roleQuery = await db.select({ slug: teamRoles.slug })
            .from(teamUser)
            .innerJoin(teamRoles, eq(teamUser.roleId, teamRoles.id))
            .where(and(eq(teamUser.teamId, teamId), eq(teamUser.userId, session.user.id)));
        const isOwner = roleQuery[0]?.slug === 'owner';

        if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        // If removing self (Leaving)
        if (userId === session.user.id) {
            // Check if only member
            const membersCount = await db.select({ count: sql<number>`count(*)` })
                .from(teamUser)
                .where(eq(teamUser.teamId, teamId));

            const count = Number(membersCount[0].count);

            if (count <= 1) {
                return NextResponse.json({ error: 'Cannot leave as the only member. Delete the team instead.' }, { status: 400 });
            }

            // Check if is OWNER and is the ONLY OWNER
            // We already fetched roleQuery for permission (isOwner requester), but that is for the REQUESTER.
            // Since userId === session.user.id, the requester IS the target.
            // So 'isOwner' variable above tells us if the leaver is an owner.

            if (isOwner) { // The leaver is an owner
                const ownersCountResult = await db.select({ count: sql<number>`count(*)` })
                    .from(teamUser)
                    .innerJoin(teamRoles, eq(teamUser.roleId, teamRoles.id))
                    .where(and(
                        eq(teamUser.teamId, teamId),
                        eq(teamRoles.slug, 'owner')
                    ));

                const ownersCount = Number(ownersCountResult[0].count);
                if (ownersCount <= 1) {
                    return NextResponse.json({ error: 'Cannot leave as the only owner. Promote another member to owner first.' }, { status: 400 });
                }
            }
        }

        await db.delete(teamUser).where(and(
            eq(teamUser.teamId, teamId),
            eq(teamUser.userId, userId)
        ));

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error removing member:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    // Update Member Role
    const { id } = await params;
    const teamId = Number(id);

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { userId, roleId } = body;

        // Check Permissions: Owner only
        const roleQuery = await db.select({ slug: teamRoles.slug })
            .from(teamUser)
            .innerJoin(teamRoles, eq(teamUser.roleId, teamRoles.id))
            .where(and(eq(teamUser.teamId, teamId), eq(teamUser.userId, session.user.id)));
        const isOwner = roleQuery[0]?.slug === 'owner';

        if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        // Check: Prevent self-demotion
        // If target user is ME, and I am changing my role...
        if (userId === session.user.id) {
            // We know current user IS owner (checked above)
            // If new role is NOT owner (i.e. member), then prevent.
            // We need to check what "roleId" maps to.
            const targetRole = await db.select().from(teamRoles).where(eq(teamRoles.id, roleId)).limit(1);
            if (targetRole.length > 0 && targetRole[0].slug !== 'owner') {
                return NextResponse.json({ error: 'Cannot demote yourself from owner' }, { status: 400 });
            }
        }

        await db.update(teamUser)
            .set({ roleId })
            .where(and(
                eq(teamUser.teamId, teamId),
                eq(teamUser.userId, userId)
            ));

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    // Add Member (Directly)
    const { id } = await params;
    const teamId = Number(id);

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { userId, roleId } = body;

        if (!userId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

        // Check Permissions: Owner only
        const roleQuery = await db.select({ slug: teamRoles.slug })
            .from(teamUser)
            .innerJoin(teamRoles, eq(teamUser.roleId, teamRoles.id))
            .where(and(eq(teamUser.teamId, teamId), eq(teamUser.userId, session.user.id)));
        const isOwner = roleQuery[0]?.slug === 'owner';

        if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        // Check if already member
        const existingMember = await db.select()
            .from(teamUser)
            .where(and(eq(teamUser.teamId, teamId), eq(teamUser.userId, userId)));

        if (existingMember.length > 0) {
            return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
        }

        // Get default role if not provided (member role)
        let finalRoleId = roleId;
        if (!finalRoleId) {
            const memberRole = await db.select().from(teamRoles).where(eq(teamRoles.slug, 'member')).limit(1);
            if (memberRole.length > 0) finalRoleId = memberRole[0].id;
        }

        if (!finalRoleId) return NextResponse.json({ error: 'Invalid config: no member role found' }, { status: 500 });

        await db.insert(teamUser).values({
            teamId,
            userId,
            roleId: finalRoleId,
            createdAt: new Date().toISOString(), // Use ISO string as per schema
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error adding member:", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
