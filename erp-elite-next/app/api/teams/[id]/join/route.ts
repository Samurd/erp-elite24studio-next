import { db } from '@/lib/db';
import { teamUser, teamRoles, teams } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const teamId = Number(id);

    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Check if team is public or check some invitation logic?
        // Basic logic: if Public, allow join.
        const team = await db.query.teams.findFirst({
            where: eq(teams.id, teamId)
        });

        if (!team) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        if (!team.isPublic) {
            // Check for invitation? For now, forbid.
            return NextResponse.json({ error: 'This team is private' }, { status: 403 });
        }

        // Check if already member
        const existing = await db.query.teamUser.findFirst({
            where: and(
                eq(teamUser.teamId, teamId),
                eq(teamUser.userId, session.user.id)
            )
        });

        if (existing) {
            return NextResponse.json({ message: 'Already a member' });
        }

        // Find "Member" role
        const memberRole = await db.query.teamRoles.findFirst({
            where: eq(teamRoles.slug, 'member')
        });

        if (!memberRole) return NextResponse.json({ error: 'Role config error' }, { status: 500 });

        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

        await db.insert(teamUser).values({
            teamId,
            userId: session.user.id,
            roleId: memberRole.id,
            createdAt: now,
            updatedAt: now
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to join' }, { status: 500 });
    }
}
