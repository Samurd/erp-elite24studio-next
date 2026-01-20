import { db } from '@/lib/db';
import { messages, users, teamChannels, filesLinks, files, messageReactions } from '@/drizzle/schema';
import { eq, and, desc, lt, sql, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { StorageService } from '@/lib/storage-service';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string, channelId: string }> }
) {
    const { id, channelId } = await params;
    const cId = Number(channelId);

    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const limit = Number(searchParams.get('limit')) || 30;
        const beforeId = searchParams.get('beforeId');

        // Build conditions
        const conditions = [eq(messages.channelId, cId)];
        if (beforeId) {
            conditions.push(lt(messages.id, Number(beforeId)));
        }

        let query = db.select({
            id: messages.id,
            content: messages.content,
            createdAt: messages.createdAt,
            userId: messages.userId,
            userName: users.name,
            userImage: users.image,
            parentId: messages.parentId
        })
            .from(messages)
            .innerJoin(users, eq(messages.userId, users.id))
            .where(and(...conditions))
            .orderBy(desc(messages.id))
            .limit(limit + 1); // Fetch one extra to check if there are more

        const rawMessages = await query;

        const messageIds = rawMessages.map(m => m.id);

        // Fetch Reactions, Replies & Parent Messages
        let reactions: any[] = [];
        let replyCounts: any[] = [];
        let parentMessages: any[] = [];

        if (messageIds.length > 0) {
            const parentIds = rawMessages.filter(m => m.parentId).map(m => m.parentId) as number[];
            const uniqueParentIds = [...new Set(parentIds)];

            const promises: Promise<any>[] = [
                db.select({
                    id: messageReactions.id,
                    messageId: messageReactions.messageId,
                    emoji: messageReactions.emoji,
                    userId: messageReactions.userId,
                    userName: users.name // for tooltip?
                })
                    .from(messageReactions)
                    .innerJoin(users, eq(messageReactions.userId, users.id))
                    .where(sql`${messageReactions.messageId} IN ${messageIds}`),

                db.select({
                    parentId: messages.parentId,
                    count: sql<number>`count(*)`
                })
                    .from(messages)
                    .where(sql`${messages.parentId} IN ${messageIds}`)
                    .groupBy(messages.parentId)
            ];

            if (uniqueParentIds.length > 0) {
                promises.push(
                    db.select({
                        id: messages.id,
                        content: messages.content,
                        userName: users.name
                    })
                        .from(messages)
                        .innerJoin(users, eq(messages.userId, users.id))
                        .where(sql`${messages.id} IN ${uniqueParentIds}`)
                );
            }

            const results = await Promise.all(promises);
            reactions = results[0];
            replyCounts = results[1];
            if (uniqueParentIds.length > 0) {
                parentMessages = results[2];
            }
        }

        // Group files by message
        const messagesMap = new Map();
        const parentMessagesMap = new Map(parentMessages.map(p => [p.id, p]));

        rawMessages.forEach(row => {
            if (!messagesMap.has(row.id)) {
                // Find reply count
                const rc = replyCounts.find((r: any) => r.parentId === row.id);
                const parentMsg = row.parentId ? parentMessagesMap.get(row.parentId) : null;

                messagesMap.set(row.id, {
                    id: row.id,
                    content: row.content,
                    createdAt: row.createdAt,
                    userId: row.userId,
                    user: {
                        id: row.userId,
                        name: row.userName,
                        image: row.userImage
                    },
                    files: [],
                    reactions: [],
                    replyCount: rc ? Number(rc.count) : 0,
                    parentId: row.parentId,
                    parentMessage: parentMsg ? {
                        id: parentMsg.id,
                        content: parentMsg.content,
                        userName: parentMsg.userName
                    } : null
                });
            }
        });

        // Fetch files using relational query
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

        // Map files to messages with proper URL generation using StorageService
        const filePromises = fileLinks.map(async (link) => {
            const msg = messagesMap.get(link.fileableId);
            if (!msg || !link.file) return;

            const url = await StorageService.getUrl(link.file.path);

            msg.files.push({
                id: link.file.id,
                name: link.file.name,
                size: link.file.size,
                type: link.file.mimeType,
                url: url || link.file.path,
                path: link.file.path,
                disk: link.file.disk
            });
        });

        await Promise.all(filePromises);

        // Generate user image URLs using StorageService
        const userImagePromises = Array.from(messagesMap.values()).map(async (msg: any) => {
            if (msg.user?.image) {
                const imageUrl = await StorageService.getUrl(msg.user.image);
                msg.user.image = imageUrl;
            }
        });
        await Promise.all(userImagePromises);

        // Group reactions
        reactions.forEach((r: any) => {
            const msg = messagesMap.get(r.messageId);
            if (msg) {
                // Existing group for this emoji?
                let group = msg.reactions.find((g: any) => g.emoji === r.emoji);
                if (!group) {
                    group = { emoji: r.emoji, count: 0, users: [], meReacted: false };
                    msg.reactions.push(group);
                }
                group.count++;
                group.users.push({ name: r.userName });
                if (r.userId === session.user.id) {
                    group.meReacted = true;
                }
            }
        });

        // Check if there are more messages
        const allMessages = Array.from(messagesMap.values());
        const hasMore = allMessages.length > limit;
        const messagesToReturn = hasMore ? allMessages.slice(0, -1) : allMessages;

        const formattedMessages = messagesToReturn.reverse();

        // Get the cursor for the next page (oldest message ID in this batch)
        const nextCursor = messagesToReturn.length > 0 ? messagesToReturn[messagesToReturn.length - 1].id : null;

        return NextResponse.json({
            messages: formattedMessages,
            hasMore,
            nextCursor
        });

    } catch (error) {
        console.error('Error fetching channel messages:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// POST for simple HTTP fallback or file attachment handling logic trigger?
// Mostly we use Socket, but this can be used for persistence if Socket fails or for consistency.
// Reuse logic from /api/chats/[id]/messages/route.ts

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string, channelId: string }> }
) {
    const { id, channelId } = await params;
    const cId = Number(channelId);

    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { content, parentId } = body;

        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

        const [newMessage] = await db.insert(messages).values({
            userId: session.user.id,
            channelId: cId,
            content,
            parentId,
            type: 'text',
            createdAt: now,
            updatedAt: now
        }).returning();

        return NextResponse.json(newMessage);

    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
