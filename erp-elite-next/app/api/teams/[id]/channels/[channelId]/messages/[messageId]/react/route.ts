import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messages, messageReactions } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; channelId: string; messageId: string }> }
) {
    const { id, channelId, messageId } = await params;
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { emoji } = await req.json();

    if (!emoji) {
        return new NextResponse('Missing emoji', { status: 400 });
    }

    try {
        // Toggle reaction logic
        // Check if reaction exists
        const existingReaction = await db.query.messageReactions.findFirst({
            where: and(
                eq(messageReactions.messageId, parseInt(messageId)),
                eq(messageReactions.userId, session.user.id),
                eq(messageReactions.emoji, emoji)
            )
        });

        if (existingReaction) {
            // Remove it
            await db.delete(messageReactions)
                .where(eq(messageReactions.id, existingReaction.id));

            return NextResponse.json({ action: 'removed' });
        } else {
            // Add it
            await db.insert(messageReactions).values({
                messageId: parseInt(messageId),
                userId: session.user.id,
                emoji,
                createdAt: new Date().toISOString()
            });

            return NextResponse.json({ action: 'added' });
        }
    } catch (error) {
        console.error('Error toggling reaction:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
