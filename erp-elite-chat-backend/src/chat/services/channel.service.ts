import { Inject, Injectable, Logger } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../db/schema';
import * as relations from '../../db/relations';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { NotificationsService } from '../../notifications/notifications.service';
import { DateService } from '../../common/services/date.service';
import { eq, and, ne } from 'drizzle-orm';

@Injectable()
export class ChannelService {
    private logger = new Logger(ChannelService.name);

    constructor(
        @Inject(DATABASE_CONNECTION)
        private readonly db: NodePgDatabase<typeof schema & typeof relations>,
        private readonly notificationsService: NotificationsService,
        private readonly dateService: DateService,
    ) { }

    async sendMessage(payload: {
        content: string;
        channelId: number;
        userId: string;
        fileIds?: number[];
        parentId?: number;
    }) {
        const { content, channelId, userId, fileIds, parentId } = payload;

        try {
            // 1. Prepare message data
            const messageData: any = {
                content,
                userId,
                type: 'text',
                createdAt: this.dateService.now(),
                parentId: parentId || null,
                channelId: channelId, // Explicitly set channelId
            };

            // 2. Insert message into DB
            const result = await this.db.insert(schema.messages).values(messageData).returning();
            const newMessage = result[0];
            const messageId = Number(newMessage.id);

            // 3. Link files to message if fileIds provided
            if (fileIds && fileIds.length > 0) {
                const now = this.dateService.now();
                const fileLinks = fileIds.map((fileId) => ({
                    fileId: fileId,
                    fileableType: 'App\\Models\\Message',
                    fileableId: messageId,
                    createdAt: now,
                    updatedAt: now,
                }));

                await this.db.insert(schema.filesLinks).values(fileLinks);
            }

            // 4. Fetch user info
            const user = await this.db.query.users.findFirst({
                where: eq(schema.users.id, userId),
            });

            // 5. Fetch linked files if any
            let linkedFiles: any[] = [];

            // Return raw image path as requested
            const userImage = user?.image;
            if (fileIds && fileIds.length > 0) {
                try {
                    // const bigIntIds = fileIds.map((id) => BigInt(id));
                    linkedFiles = await this.db.query.files.findMany({
                        where: (files, { inArray }) => inArray(files.id, fileIds),
                    });
                } catch (fileError) {
                    this.logger.error('Error fetching files:', fileError);
                }
            }

            // 6. Fetch parent message details if reply
            let parentMessageDetails: any = null;
            if (parentId) {
                const parentMsg = await this.db.query.messages.findFirst({
                    where: eq(schema.messages.id, Number(parentId)),
                    with: { user: true },
                });
                if (parentMsg) {
                    parentMessageDetails = {
                        id: Number(parentMsg.id),
                        content: parentMsg.content,
                        userName: parentMsg.user?.name || 'Unknown',
                        userId: parentMsg.userId,
                    };
                }
            }

            const messageWithUser = {
                id: messageId,
                channelId: channelId, // Add channelId for frontend tracking
                content: newMessage.content,
                createdAt: newMessage.createdAt,
                userId: newMessage.userId,
                userName: user?.name || 'Unknown',
                userEmail: user?.email || '',
                type: newMessage.type,
                files:
                    linkedFiles.length > 0
                        ? linkedFiles.map((f) => ({
                            id: Number(f.id),
                            name: f.name,
                            path: f.path,
                            url: f.path.startsWith('http') ? f.path : `/${f.path}`,
                            size: f.size,
                            mimeType: f.mimeType,
                        }))
                        : undefined,
                parentId: newMessage.parentId,
                parentMessage: parentMessageDetails,
                userImage: userImage,
                user: user ? {
                    name: user.name,
                    image: userImage,
                } : undefined,
                reactions: [], // Initialize empty reactions
                status: 'sent' // Message status
            };

            // 7. Send notifications
            await this.sendNotification(channelId, content, userId, user?.name || 'Unknown');

            return { status: 'ok', message: messageWithUser };

        } catch (error) {
            this.logger.error('Error sending channel message', error);
            throw error;
        }
    }

    async sendNotification(
        channelId: number,
        messageContent: string,
        senderId: string,
        senderName: string,
    ) {
        try {
            const channel = await this.db.query.teamChannels.findFirst({
                where: eq(schema.teamChannels.id, Number(channelId)),
            });

            if (channel && channel.teamId) {
                if (channel.isPrivate) {
                    // Private Channel: Get only channel members except sender
                    const channelMembers = await this.db
                        .select()
                        .from(schema.channelUser)
                        .where(
                            and(
                                eq(schema.channelUser.channelId, channelId),
                                ne(schema.channelUser.userId, senderId),
                            ),
                        );

                    for (const member of channelMembers) {
                        await this.notificationsService.create({
                            userId: member.userId,
                            title: `🔒 Nuevo mensaje en #${channel.name || 'canal privado'}`,
                            message: `${senderName || 'Usuario'}: ${messageContent.length > 100
                                ? messageContent.substring(0, 100) + '...'
                                : messageContent
                                }`,
                            data: {
                                action_url: `/teams/${channel.teamId}?channelId=${channelId}`,
                                channelId: channelId,
                                teamId: channel.teamId,
                                senderId: senderId,
                                senderName: senderName,
                            },
                            notifiableType: 'Channel',
                            notifiableId: channelId,
                        });
                    }
                } else {
                    // Public Channel: Get all team members except sender
                    const teamMembers = await this.db
                        .select()
                        .from(schema.teamUser)
                        .where(
                            and(
                                eq(schema.teamUser.teamId, channel.teamId),
                                ne(schema.teamUser.userId, senderId),
                            ),
                        );

                    for (const member of teamMembers) {
                        await this.notificationsService.create({
                            userId: member.userId,
                            title: `💬 Nuevo mensaje en #${channel.name || 'canal'}`,
                            message: `${senderName || 'Usuario'}: ${messageContent.length > 100
                                ? messageContent.substring(0, 100) + '...'
                                : messageContent
                                }`,
                            data: {
                                action_url: `/teams/${channel.teamId}?channelId=${channelId}`,
                                channelId: channelId,
                                teamId: channel.teamId,
                                senderId: senderId,
                                senderName: senderName,
                            },
                            notifiableType: 'Channel',
                            notifiableId: channelId,
                        });
                    }
                }
            }
        } catch (error) {
            this.logger.error('Error sending channel notifications:', error);
        }
    }
}
