import { db } from '@/lib/db';
import { teamUser, teamRoles } from '@/drizzle/schema';
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

        // Check if Owner? If owner, and only owner, maybe prevent leaving without transferring?
        // Logic: just delete record from teamUser.

        await db.delete(teamUser)
            .where(
                and(
                    eq(teamUser.teamId, teamId),
                    eq(teamUser.userId, session.user.id)
                )
            );

        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to leave' }, { status: 500 });
    }
}
