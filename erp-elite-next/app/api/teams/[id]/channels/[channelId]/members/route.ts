import { db } from '@/lib/db';
import { channelUser, teamUser, teamRoles, users } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

// GET - List channel members
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string, channelId: string }> }
) {
    const { id, channelId } = await params;
    const teamId = Number(id);
    const channelIdNum = Number(channelId);

    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Get channel members
        const members = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            profile_photo_url: users.image
        })
            .from(channelUser)
            .innerJoin(users, eq(channelUser.userId, users.id))
            .where(eq(channelUser.channelId, channelIdNum));

        return NextResponse.json({ members });

    } catch (error) {
        console.error('Error fetching channel members:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// POST - Add member to channel
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string, channelId: string }> }
) {
    const { id, channelId } = await params;
    const teamId = Number(id);
    const channelIdNum = Number(channelId);

    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Check if user is team owner
        const roleQuery = await db.select({ slug: teamRoles.slug })
            .from(teamUser)
            .innerJoin(teamRoles, eq(teamUser.roleId, teamRoles.id))
            .where(and(eq(teamUser.teamId, teamId), eq(teamUser.userId, session.user.id)));

        const isOwner = roleQuery[0]?.slug === 'owner';
        if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await request.json();
        const { userId } = body;

        if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

        await db.insert(channelUser).values({
            channelId: channelIdNum,
            userId,
            createdAt: now,
            updatedAt: now
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error adding channel member:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
