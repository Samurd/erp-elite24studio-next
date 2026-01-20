import { db } from '@/lib/db';
import { channelUser, teamUser, teamRoles } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

// DELETE - Remove member from channel
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string, channelId: string, userId: string }> }
) {
    const { id, channelId, userId } = await params;
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

        await db.delete(channelUser)
            .where(and(
                eq(channelUser.channelId, channelIdNum),
                eq(channelUser.userId, userId)
            ));

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error removing channel member:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
