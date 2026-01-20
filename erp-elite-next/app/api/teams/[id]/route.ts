
import { db } from '@/lib/db';
import { teams, teamUser, teamRoles, teamChannels, users, channelUser } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
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
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const currentUserId = session.user.id;

        // Fetch Basic Team Info
        const team = await db.query.teams.findFirst({
            where: eq(teams.id, teamId)
        });

        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        // Fetch Members with Roles
        const membersList = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            profile_photo_url: users.image, // mapping
            role_id: teamUser.roleId,
            role_name: teamRoles.name,
            role_slug: teamRoles.slug,
            joined_at: teamUser.createdAt
        })
            .from(teamUser)
            .innerJoin(users, eq(teamUser.userId, users.id))
            .innerJoin(teamRoles, eq(teamUser.roleId, teamRoles.id))
            .where(eq(teamUser.teamId, teamId));

        // Check if current user is member
        const currentUserMembership = membersList.find(m => m.id === currentUserId);
        const isMember = !!currentUserMembership;
        const currentUserRole = currentUserMembership ? {
            id: currentUserMembership.role_id,
            slug: currentUserMembership.role_slug
        } : null;

        // Fetch all channels
        const channelsList = await db.query.teamChannels.findMany({
            where: eq(teamChannels.teamId, teamId)
        });

        // Filter private channels based on channel_user membership
        let visibleChannels = channelsList;
        if (isMember) {
            // Get channels where user is explicitly a member (for private channels)
            const userChannelMemberships = await db.query.channelUser.findMany({
                where: eq(channelUser.userId, currentUserId)
            });
            const userChannelIds = new Set(userChannelMemberships.map(m => m.channelId));

            // Filter: all public channels + private channels where user is a member
            visibleChannels = channelsList.filter(channel => {
                if (!channel.isPrivate) {
                    return true; // Public channels visible to all team members
                }
                return userChannelIds.has(channel.id); // Private channels only if user is member
            });
        } else {
            // Non-members can only see public channels
            visibleChannels = channelsList.filter(c => !c.isPrivate);
        }

        return NextResponse.json({
            team: {
                ...team,
                profile_photo_url: team.profilePhotoPath,
            },
            channels: visibleChannels.map(c => ({
                ...c,
                is_channel_member: isMember && !c.isPrivate,
            })),
            members: membersList,
            isMember,
            currentUserRole
        });

    } catch (error) {
        console.error('Error fetching team:', error);
        return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
    }
}

export async function PUT(
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



        const roleQuery = await db.select({ slug: teamRoles.slug })
            .from(teamUser)
            .innerJoin(teamRoles, eq(teamUser.roleId, teamRoles.id))
            .where(and(
                eq(teamUser.teamId, teamId),
                eq(teamUser.userId, session.user.id)
            ));

        const isOwner = roleQuery[0]?.slug === 'owner';

        if (!isOwner) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        console.log("PUT Team Body:", body);
        const { name, description, isPublic, photo_url } = body;

        // Construct update object safely
        const updateData: any = {
            updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
        };

        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (isPublic !== undefined) updateData.isPublic = isPublic;
        if (photo_url !== undefined) updateData.profilePhotoPath = photo_url;

        console.log("Updating DB with:", updateData);

        await db.update(teams)
            .set(updateData)
            .where(eq(teams.id, teamId));

        return NextResponse.json({ success: true, updated: updateData });

    } catch (error) {
        console.error('Error updating team:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function DELETE(
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

        // Check owner
        const roleQuery = await db.select({ slug: teamRoles.slug })
            .from(teamUser)
            .innerJoin(teamRoles, eq(teamUser.roleId, teamRoles.id))
            .where(and(
                eq(teamUser.teamId, teamId),
                eq(teamUser.userId, session.user.id)
            ));

        const isOwner = roleQuery[0]?.slug === 'owner';

        if (!isOwner) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await db.delete(teams).where(eq(teams.id, teamId));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting team:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
