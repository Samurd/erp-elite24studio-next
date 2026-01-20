import { db } from '@/lib/db';
import { privateChats, privateChatUser, users } from '@/drizzle/schema';
import { eq, and, ne } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { StorageService } from '@/lib/storage-service';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const chatId = parseInt(id, 10);
    const { searchParams } = new URL(request.url);
    const currentUserId = searchParams.get('userId');

    if (!currentUserId) {
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    try {
        // Get the other participant in this private chat
        const otherParticipant = await db
            .select({
                userId: privateChatUser.userId,
                userName: users.name,
                userEmail: users.email,
                userImage: users.image,
            })
            .from(privateChatUser)
            .leftJoin(users, eq(privateChatUser.userId, users.id))
            .where(and(
                eq(privateChatUser.privateChatId, chatId),
                ne(privateChatUser.userId, currentUserId)
            ))
            .limit(1);

        if (otherParticipant.length === 0) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
        }

        // Generate user image URL using StorageService
        const userImageUrl = await StorageService.getUrl(otherParticipant[0].userImage);

        const otherUser = {
            id: otherParticipant[0].userId,
            name: otherParticipant[0].userName,
            email: otherParticipant[0].userEmail,
            image: userImageUrl,
        };

        return NextResponse.json({
            chatId,
            otherUser,
        });
    } catch (error) {
        console.error('Error fetching chat info:', error);
        return NextResponse.json({ error: 'Failed to fetch chat info' }, { status: 500 });
    }
}
