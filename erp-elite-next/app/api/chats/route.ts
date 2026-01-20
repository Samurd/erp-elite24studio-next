import { db } from '@/lib/db';
import { privateChatUser, privateChats, users, messages } from '@/drizzle/schema';
import { eq, and, ne, desc, aliasedTable, sql, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { StorageService } from '@/lib/storage-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const paramUserId = searchParams.get('userId') || '2';
    const searchQuery = searchParams.get('search');
    const currentUserId = String(paramUserId);

    try {
        if (searchQuery) {
            // Search mode: Find users matching the query
            // We also want to know if we already have a chat with them
            const searchResults = await db
                .select({
                    id: users.id,
                    name: users.name,
                    image: users.image,
                })
                .from(users)
                .where(and(
                    ne(users.id, currentUserId),
                    or(
                        sql`lower(${users.name}) like ${`%${searchQuery.toLowerCase()}%`}`,
                        sql`lower(${users.email}) like ${`%${searchQuery.toLowerCase()}%`}`
                    )
                ))
                .limit(20);

            // For the found users, check if a chat exists
            const distinctResults = await Promise.all(searchResults.map(async (user) => {
                // Check for existing chat
                // This is still N queries but N is small (limit 20) which is acceptable for search
                // Proper optimization would be a complex join but this is safe for now
                const existingChat = await db
                    .select({
                        chatId: privateChatUser.privateChatId
                    })
                    .from(privateChatUser)
                    .where(eq(privateChatUser.userId, currentUserId))
                    // subquery to find if target user is in same chat
                    .innerJoin(
                        aliasedTable(privateChatUser, 'target_user_chat'),
                        and(
                            eq(sql`target_user_chat.private_chat_id`, privateChatUser.privateChatId),
                            eq(sql`target_user_chat.user_id`, user.id)
                        )
                    )
                    .limit(1);

                const avatarUrl = await StorageService.getUrl(user.image);

                return {
                    userId: user.id,
                    name: user.name,
                    avatar: avatarUrl,
                    chatId: existingChat[0]?.chatId || null,
                    lastMessage: null, // Don't need last message for search results usually
                    unreadCount: 0
                };
            }));

            return NextResponse.json(distinctResults);

        } else {
            // Active Chats mode: Get ONLY chats where the user is a participant
            // join privateChatUser(me) -> privateChatUser(them) -> users(them)

            // 1. Get all chat IDs for current user
            const myChats = await db
                .select({
                    chatId: privateChatUser.privateChatId,
                })
                .from(privateChatUser)
                .where(eq(privateChatUser.userId, currentUserId));

            if (myChats.length === 0) {
                return NextResponse.json([]);
            }

            const chatIds = myChats.map(c => c.chatId);

            // 2. Fetch details for these chats: The OTHER user and the LAST message
            const activeChats = await Promise.all(chatIds.map(async (chatId) => {
                // Find the other participant
                const otherParticipant = await db
                    .select({
                        userId: users.id,
                        name: users.name,
                        image: users.image,
                    })
                    .from(privateChatUser)
                    .where(and(
                        eq(privateChatUser.privateChatId, chatId),
                        ne(privateChatUser.userId, currentUserId)
                    ))
                    .innerJoin(users, eq(users.id, privateChatUser.userId))
                    .limit(1);

                if (!otherParticipant[0]) return null;

                const partner = otherParticipant[0];
                const avatarUrl = await StorageService.getUrl(partner.image);

                // Get last message
                const lastMessage = await db
                    .select({
                        content: messages.content,
                        createdAt: messages.createdAt,
                    })
                    .from(messages)
                    .where(eq(messages.privateChatId, chatId))
                    .orderBy(desc(messages.createdAt))
                    .limit(1);

                // Count unread (simple approximation for now, or fetch from read receipts if they existed)
                // For now assuming 0 if not implemented in schema fully

                return {
                    userId: partner.userId,
                    name: partner.name,
                    avatar: avatarUrl,
                    chatId: chatId,
                    lastMessage: lastMessage[0] ? {
                        content: lastMessage[0].content,
                        createdAt: lastMessage[0].createdAt
                    } : null,
                    unreadCount: 0
                };
            }));

            // Filter out nulls (chats with no other user? shouldn't happen but safe to filter)
            // And sort by last message
            const validChats = activeChats
                .filter(c => c !== null && c.lastMessage !== null) // Only show chats with history? Or allow empty chats?
                // Let's show chats even without messages if they exist explicitly, checking c !== null
                // But usually "Active Chat" implies some history or intent.
                // Re-reading plan: "Active Chats (conversations with history)". 
                // Let's keep chats even if empty message if they were explicitly created.
                .filter((c): c is NonNullable<typeof c> => c !== null)
                .sort((a, b) => {
                    const dateA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
                    const dateB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
                    return dateB - dateA;
                });

            return NextResponse.json(validChats);
        }

    } catch (error) {
        console.error('Error fetching chats:', error);
        return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { currentUserId, targetUserId } = body;

        if (!currentUserId || !targetUserId) {
            return NextResponse.json({ error: 'Missing user IDs' }, { status: 400 });
        }

        // Validate that both users exist
        const [currentUser, targetUser] = await Promise.all([
            db.query.users.findFirst({ where: eq(users.id, currentUserId) }),
            db.query.users.findFirst({ where: eq(users.id, targetUserId) })
        ]);

        if (!currentUser) {
            return NextResponse.json({ error: `Current user not found: ${currentUserId}` }, { status: 404 });
        }

        if (!targetUser) {
            return NextResponse.json({ error: `Target user not found: ${targetUserId}` }, { status: 404 });
        }

        // Check if chat already exists between these two users
        const existingChats = await db
            .select({ chatId: privateChatUser.privateChatId })
            .from(privateChatUser)
            .where(eq(privateChatUser.userId, currentUserId))
            .groupBy(privateChatUser.privateChatId);

        // For each chat the current user is in, check if target user is also in it
        for (const chat of existingChats) {
            const targetInChat = await db.query.privateChatUser.findFirst({
                where: and(
                    eq(privateChatUser.privateChatId, chat.chatId),
                    eq(privateChatUser.userId, targetUserId)
                )
            });

            if (targetInChat) {
                // Chat already exists, return existing chat ID
                console.log('Chat already exists:', chat.chatId);
                return NextResponse.json({ chatId: chat.chatId });
            }
        }

        // No existing chat found, create new one
        const now = new Date();
        const formattedDate = now.toISOString().slice(0, 19).replace('T', ' ');

        const [newChat] = await db.insert(privateChats).values({
            isGroup: false,
            createdAt: formattedDate,
            updatedAt: formattedDate,
        }).returning();

        const newChatId = newChat.id;

        // Add participants
        await db.insert(privateChatUser).values([
            {
                privateChatId: newChatId,
                userId: currentUserId,
                createdAt: formattedDate,
                updatedAt: formattedDate,
            },
            {
                privateChatId: newChatId,
                userId: targetUserId,
                createdAt: formattedDate,
                updatedAt: formattedDate,
            }
        ]);

        console.log('Created new chat:', newChatId);
        return NextResponse.json({ chatId: newChatId });

    } catch (error) {
        console.error('Error creating chat:', error);
        return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
    }
}
