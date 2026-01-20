import { db } from '@/lib/db';
import { teamRoles } from '@/drizzle/schema';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const roles = await db.select().from(teamRoles);
        return NextResponse.json(roles);
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
