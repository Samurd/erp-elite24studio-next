import { db } from '@/lib/db';
import { teamUser, teamChannels, teamRoles, teams, channelUser } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    // List channels for a Team
    const { id } = await params;
    const teamId = Number(id);

    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Access Check: Must be team member (for Public channels) or specific logic for Private?
        // Basic list: all public channels + private ones user is in.
        // If user is owner, maybe all?

        // Check membership
        const membership = await db.query.teamUser.findFirst({
            where: and(
                eq(teamUser.teamId, teamId),
                eq(teamUser.userId, session.user.id)
            ),
            with: {
                teamRole: true
            }
        });

        if (!membership) {
            // If team is Public, maybe can list public channels?
            // But usually you join team first.
            // Let's assume you must be member.
            const team = await db.query.teams.findFirst({ where: eq(teams.id, teamId) });
            if (!team || !team.isPublic) {
                // For now restrictive
                return NextResponse.json({ error: 'Access denied' }, { status: 403 });
            }
        }

        // Fetch all channels for the team
        const allChannels = await db.query.teamChannels.findMany({
            where: eq(teamChannels.teamId, teamId)
        });

        // If not a team member, show only public channels
        if (!membership) {
            return NextResponse.json(allChannels.filter(c => !c.isPrivate));
        }

        // Get channels where user is explicitly a member (for private channels)
        const userChannelMemberships = await db.query.channelUser.findMany({
            where: eq(channelUser.userId, session.user.id)
        });

        const userChannelIds = new Set(userChannelMemberships.map(m => m.channelId));

        // Filter channels: all public channels + private channels where user is a member
        const visibleChannels = allChannels.filter(channel => {
            if (!channel.isPrivate) {
                // Public channels are visible to all team members
                return true;
            }
            // Private channels are only visible if user is in channel_user
            return userChannelIds.has(channel.id);
        });

        return NextResponse.json(visibleChannels);

    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

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

        // Owner only creation?
        const membership = await db.query.teamUser.findFirst({
            where: and(
                eq(teamUser.teamId, teamId),
                eq(teamUser.userId, session.user.id)
            ),
            with: { teamRole: true } // Assuming relations exist
        });

        // Manual role check if needed
        const roleQuery = await db.select({ slug: teamRoles.slug })
            .from(teamUser)
            .innerJoin(teamRoles, eq(teamUser.roleId, teamRoles.id))
            .where(and(eq(teamUser.teamId, teamId), eq(teamUser.userId, session.user.id)));

        const isOwner = roleQuery[0]?.slug === 'owner';

        if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await request.json();
        const { name, description, isPrivate, parent_id } = body;

        if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

        const slug = name.toLowerCase().replace(/ /g, '-'); // Simple slug
        // Add random suffix if slug collision? For now assume valid.

        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

        const [newChannel] = await db.insert(teamChannels).values({
            teamId,
            name,
            slug,
            description,
            isPrivate: !!isPrivate,
            parentId: parent_id,
            createdAt: now,
            updatedAt: now
        }).returning();

        // If private channel, add the creator as a member
        if (isPrivate) {
            await db.insert(channelUser).values({
                channelId: newChannel.id,
                userId: session.user.id,
                createdAt: now,
                updatedAt: now
            });
        }

        return NextResponse.json(newChannel);

    } catch (error) {
        console.error('Error creating channel:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
