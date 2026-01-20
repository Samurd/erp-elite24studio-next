import { db } from '@/lib/db';
import { teamChannels, teamUser, teamRoles } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string, channelId: string }> }
) {
    const { id, channelId } = await params;
    const teamId = Number(id);
    const cId = Number(channelId); // Using 'cId' to avoid conflict

    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const channel = await db.query.teamChannels.findFirst({
            where: and(
                eq(teamChannels.id, cId),
                eq(teamChannels.teamId, teamId)
            )
        });

        if (!channel) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Access check logic (Private/Public) goes here. 
        // For now, if public -> OK if team member.
        // If private -> OK if channel member (missing pivot).

        return NextResponse.json(channel);

    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string, channelId: string }> }
) {
    const { id, channelId } = await params;
    const teamId = Number(id);
    const cId = Number(channelId);

    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Owner Check
        const roleQuery = await db.select({ slug: teamRoles.slug })
            .from(teamUser)
            .innerJoin(teamRoles, eq(teamUser.roleId, teamRoles.id))
            .where(and(eq(teamUser.teamId, teamId), eq(teamUser.userId, session.user.id)));
        const isOwner = roleQuery[0]?.slug === 'owner';

        if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await request.json();
        const { name, description } = body;

        const slug = name ? name.toLowerCase().replace(/ /g, '-') : undefined;

        await db.update(teamChannels)
            .set({
                ...(name && { name, slug }),
                ...(description !== undefined && { description }),
                updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
            })
            .where(eq(teamChannels.id, cId));

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string, channelId: string }> }
) {
    const { id, channelId } = await params;
    const teamId = Number(id);
    const cId = Number(channelId);

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Owner Check
        const roleQuery = await db.select({ slug: teamRoles.slug })
            .from(teamUser)
            .innerJoin(teamRoles, eq(teamUser.roleId, teamRoles.id))
            .where(and(eq(teamUser.teamId, teamId), eq(teamUser.userId, session.user.id)));
        const isOwner = roleQuery[0]?.slug === 'owner';

        if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        await db.delete(teamChannels).where(eq(teamChannels.id, cId));
        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
