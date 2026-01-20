import { db } from '@/lib/db';
import { teams, teamUser, teamRoles, teamChannels, users } from '@/drizzle/schema';
import { eq, and, like, or, sql, desc, count } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const currentUserId = session.user.id;
        const { searchParams } = new URL(request.url);

        const search = searchParams.get('search');
        const isPublicFilter = searchParams.get('isPublicFilter');
        const perPage = Number(searchParams.get('perPage')) || 10;
        const page = Number(searchParams.get('page')) || 1;
        const offset = (page - 1) * perPage;

        // Build query conditions
        const conditions = [];

        if (search) {
            conditions.push(like(teams.name, `%${search}%`));
        }

        if (isPublicFilter !== null && isPublicFilter !== undefined && isPublicFilter !== '') {
            if (isPublicFilter === '1') {
                conditions.push(eq(teams.isPublic, true));
            } else {
                conditions.push(eq(teams.isPublic, false));
            }
        }

        // Main Query
        // We need: Team Data + Member Count + Channel Count + Is Current User Member?
        // Drizzle doesn't have great 'withCount' support yet mixed with other fields easily in one object query 
        // without raw SQL or groupBy.
        // Let's use a standard query builder approach.

        const query = db.select({
            id: teams.id,
            name: teams.name,
            description: teams.description,
            profile_photo_url: teams.profilePhotoPath, // Mapping for frontend compatibility
            isPublic: teams.isPublic,
            createdAt: teams.createdAt,
            // Subqueries for counts could be expensive but standard way in SQL
            members_count: sql<number>`(SELECT count(*) FROM ${teamUser} WHERE ${teamUser.teamId} = ${teams.id})`,
            channels_count: sql<number>`(SELECT count(*) FROM ${teamChannels} WHERE ${teamChannels.teamId} = ${teams.id})`,
            // We join to check if user is member, but dealing with duplicates if we join directly
            // Instead, let's just checking if current user is member via subquery or separate fetch?
            // Laravel eager loaded: 'members' => function($q) use ($uid) { where('user_id', $uid); }
            // Let's include a boolean or the member record if exists
            is_member: sql<boolean>`EXISTS(SELECT 1 FROM ${teamUser} WHERE ${teamUser.teamId} = ${teams.id} AND ${teamUser.userId} = ${currentUserId})`
        })
            .from(teams)
            .limit(perPage)
            .offset(offset)
            .orderBy(desc(teams.createdAt));

        if (conditions.length > 0) {
            query.where(and(...conditions));
        }

        const data = await query;

        // Count total for pagination
        const countQuery = db.select({ count: count() }).from(teams);
        if (conditions.length > 0) {
            countQuery.where(and(...conditions));
        }
        const [totalResult] = await countQuery;
        const total = totalResult.count;

        // Transform data to match what frontend expects
        // Frontend expects "members" array with current user if member to check role.
        // Or we can just pass `membership` object.
        // The frontend code I saw uses: `team.members ? team.members[0] : null` to check badge.
        // Let's manually fetch the membership details for these teams for the current user to populate `members` array mock

        const teamIds = data.map(t => t.id);
        let memberships: any[] = [];

        if (teamIds.length > 0) {
            memberships = await db.select({
                teamId: teamUser.teamId,
                roleId: teamUser.roleId,
                roleSlug: teamRoles.slug,
                userId: teamUser.userId
            })
                .from(teamUser)
                .innerJoin(teamRoles, eq(teamUser.roleId, teamRoles.id))
                .where(
                    and(
                        sql`${teamUser.teamId} IN ${teamIds}`,
                        eq(teamUser.userId, currentUserId) // Only current user membership
                    )
                );
        }

        const teamsWithMeta = data.map(team => {
            const membership = memberships.find(m => m.teamId === team.id);
            return {
                ...team,
                members: membership ? [{
                    id: membership.userId,
                    pivot: { role_id: membership.roleId }, // Mock pivot for older logic if needed
                    role_slug: membership.roleSlug
                }] : [],
                members_count: Number(team.members_count),
                channels_count: Number(team.channels_count)
            };
        });

        return NextResponse.json({
            data: teamsWithMeta,
            total,
            page,
            perPage,
            last_page: Math.ceil(total / perPage),
            from: offset + 1,
            to: offset + data.length
        });

    } catch (error) {
        console.error('Error listing teams:', error);
        return NextResponse.json({ error: 'Failed to list teams' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, isPublic, photo_url } = body; // photo_url if handled by client upload

        // Basic Validation
        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // 1. Create Team
        const [newTeam] = await db.insert(teams).values({
            name,
            description,
            isPublic: isPublic !== undefined ? isPublic : true,
            profilePhotoPath: photo_url || null,
            createdAt: now,
            updatedAt: now
        }).returning();

        // 2. Find Owner Role
        const ownerRole = await db.query.teamRoles.findFirst({
            where: eq(teamRoles.slug, 'owner')
        });

        if (ownerRole) {
            // 3. Add Creator as Owner
            await db.insert(teamUser).values({
                teamId: newTeam.id,
                userId: session.user.id,
                roleId: ownerRole.id,
                createdAt: now,
                updatedAt: now
            });
        } else {
            console.warn('Owner role not found! Created team without owner.');
        }

        return NextResponse.json(newTeam);

    } catch (error) {
        console.error('Error creating team:', error);
        return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
    }
}
