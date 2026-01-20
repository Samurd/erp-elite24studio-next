import { db } from '@/lib/db';
import { messages, users, filesLinks, files } from '@/drizzle/schema';
import { eq, asc, and, desc, lt, sql } from 'drizzle-orm';
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
    const type = searchParams.get('type') || 'private';
    const limit = Number(searchParams.get('limit')) || 30;
    const beforeId = searchParams.get('beforeId');

    try {
        // Build base conditions
        const conditions = [];
        if (type === 'channel') {
            conditions.push(eq(messages.channelId, chatId));
        } else {
            conditions.push(eq(messages.privateChatId, chatId));
        }

        // Add cursor condition if provided
        if (beforeId) {
            conditions.push(lt(messages.id, Number(beforeId)));
        }

        let query = db
            .select({
                id: messages.id,
                content: messages.content,
                createdAt: messages.createdAt,
                userId: messages.userId,
                userName: users.name,
                userEmail: users.email,
                userImage: users.image,
                type: messages.type,
            })
            .from(messages)
            .leftJoin(users, eq(messages.userId, users.id))
            .where(and(...conditions))
            .orderBy(desc(messages.id))
            .limit(limit + 1); // Fetch one extra to check if there are more

        const history = await query;
        const messageIds = history.map(m => m.id);

        // Batch fetch files using relational query
        const fileLinks = messageIds.length > 0
            ? await db.query.filesLinks.findMany({
                where: and(
                    eq(filesLinks.fileableType, 'App\\Models\\Message'),
                    sql`${filesLinks.fileableId} IN (${sql.join(messageIds.map(id => sql`${id}`), sql`, `)})`
                ),
                with: {
                    file: true
                }
            })
            : [];

        // Map files to messages
        const messagesWithFiles = await Promise.all(history.map(async (msg) => {
            if (!msg.id) return { ...msg };

            const recordFiles = fileLinks
                .filter(link => link.fileableId === msg.id && link.file)
                .map(link => link.file);

            if (recordFiles.length === 0) {
                // Generate user image URL using StorageService
                const userImageUrl = await StorageService.getUrl(msg.userImage);
                return { ...msg, userImage: userImageUrl };
            }

            // Generate URLs for files using StorageService
            const filesWithUrls = await Promise.all(recordFiles.map(async (f) => {
                const url = await StorageService.getUrl(f.path);
                return {
                    id: f.id,
                    name: f.name,
                    size: f.size,
                    mimeType: f.mimeType,
                    url: url || f.path,
                    path: f.path,
                    disk: f.disk
                };
            }));

            // Generate user image URL using StorageService
            const userImageUrl = await StorageService.getUrl(msg.userImage);

            return {
                ...msg,
                userImage: userImageUrl,
                files: filesWithUrls.length > 0 ? filesWithUrls : undefined
            };
        }));

        // Check if there are more messages
        const hasMore = messagesWithFiles.length > limit;
        const paginatedMessages = hasMore ? messagesWithFiles.slice(0, -1) : messagesWithFiles;

        // Reverse to get chronological order (oldest to newest in the page)
        const reversedMessages = paginatedMessages.reverse();

        // Get the cursor for the next page (oldest message ID in this batch)
        const nextCursor = paginatedMessages.length > 0 ? paginatedMessages[paginatedMessages.length - 1].id : null;

        return NextResponse.json({
            messages: reversedMessages,
            hasMore,
            nextCursor
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const chatId = parseInt(id, 10);

    try {
        const body = await request.json();
        const { content, userId, type = 'text' } = body;

        if (!content || !userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate user exists
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId)
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const now = new Date();
        const formattedDate = now.toISOString().slice(0, 19).replace('T', ' ');

        // Insert message
        const [newMessage] = await db.insert(messages).values({
            userId,
            privateChatId: chatId,
            content,
            type,
            createdAt: formattedDate,
            updatedAt: formattedDate,
        }).returning();

        // Generate user image URL using StorageService
        const userImageUrl = await StorageService.getUrl(user.image);

        // Return message with user info
        const messageWithUser = {
            id: newMessage.id,
            content: newMessage.content,
            createdAt: newMessage.createdAt,
            userId: newMessage.userId,
            userName: user.name,
            userEmail: user.email,
            userImage: userImageUrl,
            type: newMessage.type,
        };

        return NextResponse.json(messageWithUser);
    } catch (error) {
        console.error('Error creating message:', error);
        return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
    }
}

