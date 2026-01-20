import { Inject, Injectable, Logger } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../db/schema';
import * as relations from '../../db/relations';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { NotificationsService } from '../../notifications/notifications.service';
import { DateService } from '../../common/services/date.service';
import { eq, and, ne } from 'drizzle-orm';
import { ChannelService } from './channel.service';

@Injectable()
export class ChatService {
  private logger = new Logger(ChatService.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema & typeof relations>,
    private readonly notificationsService: NotificationsService,
    private readonly dateService: DateService,
    private readonly channelService: ChannelService,
  ) { }

  async sendMessage(payload: {
    content: string;
    roomId: string; // Expected format: "private:123" where 123 is privateChatId
    userId: string;
    fileIds?: number[];
    parentId?: number;
  }) {
    const { content, roomId, userId, fileIds, parentId } = payload;

    try {
      // 1. Parse Room ID
      const [type, idStr] = roomId.split(':');
      if (type !== 'private') {
        throw new Error('Invalid room type for ChatService');
      }
      const privateChatId = parseInt(idStr, 10);
      if (isNaN(privateChatId)) {
        this.logger.error(`Invalid private chat ID: ${idStr}`);
        throw new Error('Invalid private chat ID');
      }

      // 2. Persist Message
      const messageData: any = {
        content,
        userId,
        type: 'text',
        createdAt: this.dateService.now(),
        order: Date.now(), // Fallback sort
        parentId: parentId || null,
        privateChatId: privateChatId, // Essential link
      };

      const result = await this.db
        .insert(schema.messages)
        .values(messageData)
        .returning();
      const newMessage = result[0];
      const messageId = Number(newMessage.id);

      // 3. Link files
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
      const userImage = user?.image;

      // 5. Fetch linked files details
      let linkedFiles: any[] = [];
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


      let parentMessageDetails: any = null;
      if (parentId) {
        const parent = await this.db.query.messages.findFirst({
          where: eq(schema.messages.id, parentId),
          with: { user: true },
        });

        if (parent) {
          parentMessageDetails = {
            id: Number(parent.id),
            content: parent.content,
            userName: parent.user?.name || 'Unknown',
          };
        }
      }
      const messageWithUser = {
        id: messageId,
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
        user: user
          ? {
            name: user.name,
            image: userImage,
          }
          : undefined,
        reactions: [], // Initialize empty reactions
        status: 'sent', // Optimistic status
      };

      // 7. Send Notifications
      // Look up the OTHER participants in this private chat
      await this.sendNotifications(privateChatId, userId, user, content);

      return { status: 'ok', message: messageWithUser };
    } catch (error) {
      this.logger.error('Error sending private message', error);
      throw error;
    }
  }

  private async sendNotifications(
    privateChatId: number,
    senderId: string,
    senderUser: any,
    content: string,
  ) {
    try {
      // Find other participants in this chat
      const participants = await this.db
        .select()
        .from(schema.privateChatUser)
        .where(
          and(
            eq(schema.privateChatUser.privateChatId, privateChatId),
            ne(schema.privateChatUser.userId, senderId),
          ),
        );

      this.logger.log(
        `Found ${participants.length} participants to notify for chat ${privateChatId}`,
      );

      for (const participant of participants) {
        this.logger.log(
          `Creating notification for user ${participant.userId} with sendEmail: true`,
        );
        await this.notificationsService.create({
          userId: participant.userId,
          title: `📩 Nuevo mensaje de ${senderUser?.name || 'Alguien'}`,
          message:
            content.length > 50 ? content.substring(0, 50) + '...' : content,
          data: {
            action_url: `/chats/${privateChatId}`,
            actionUrl: `/chats/${privateChatId}`, // For email button
            senderId: senderId,
            chatId: privateChatId,
            email_template: 'new-message',
            sender_name: senderUser?.name || 'Alguien',
            message_content: content,
          },
          notifiableType: 'PrivateChat',
          notifiableId: privateChatId,
          sendEmail: true,
        });
        this.logger.log(
          `Notification created successfully for user ${participant.userId} in chat ${privateChatId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error sending notifications for chat ${privateChatId}:`,
        error,
      );
      this.logger.error(`Error details:`, error.stack);
      // Don't block message sending if notification fails
    }
  }

  /**
   * Handle message reactions with proper toggle logic.
   * DB Constraint: One reaction per user per message (message_id, user_id unique).
   * Logic:
   * - If user clicks same emoji they already reacted with -> REMOVE
   * - If user clicks different emoji -> UPDATE to new emoji
   * - If user hasn't reacted yet -> ADD
   */
  async handleReaction(payload: {
    roomId: string;
    messageId: number;
    userId: string;
    emoji: string;
    action: 'add' | 'remove';
  }) {
    const { messageId, userId, emoji, action } = payload;
    try {
      // Check if user has ANY existing reaction on this message
      const existingReaction = await this.db.query.messageReactions.findFirst({
        where: and(
          eq(schema.messageReactions.messageId, messageId),
          eq(schema.messageReactions.userId, userId),
        ),
      });

      if (action === 'add') {
        if (!existingReaction) {
          // User has no reaction yet -> INSERT
          await this.db.insert(schema.messageReactions).values({
            messageId: messageId,
            userId,
            emoji,
            createdAt: this.dateService.now(),
            updatedAt: this.dateService.now(),
          });
        } else if (existingReaction.emoji === emoji) {
          // User clicked the same emoji again -> REMOVE (toggle off)
          await this.db
            .delete(schema.messageReactions)
            .where(eq(schema.messageReactions.id, existingReaction.id));
        } else {
          // User clicked a different emoji -> UPDATE
          await this.db
            .update(schema.messageReactions)
            .set({
              emoji: emoji,
              updatedAt: this.dateService.now(),
            })
            .where(eq(schema.messageReactions.id, existingReaction.id));
        }
      } else if (action === 'remove' && existingReaction) {
        // Explicit remove action
        await this.db
          .delete(schema.messageReactions)
          .where(eq(schema.messageReactions.id, existingReaction.id));
      }

      // Return updated reactions for the message
      const reactions = await this.db
        .select({
          emoji: schema.messageReactions.emoji,
          userId: schema.messageReactions.userId,
          userName: schema.users.name,
        })
        .from(schema.messageReactions)
        .leftJoin(
          schema.users,
          eq(schema.messageReactions.userId, schema.users.id),
        )
        .where(eq(schema.messageReactions.messageId, messageId));

      // Group by emoji
      const grouped = reactions.reduce((acc: any[], curr) => {
        const existing = acc.find((r) => r.emoji === curr.emoji);
        const userObj = { id: curr.userId, name: curr.userName };
        if (existing) {
          existing.count++;
          existing.users.push(userObj);
          existing.userIds.push(curr.userId);
        } else {
          acc.push({
            emoji: curr.emoji,
            count: 1,
            users: [userObj],
            userIds: [curr.userId],
          });
        }
        return acc;
      }, []);

      return { status: 'ok', messageId, reactions: grouped };
    } catch (e) {
      this.logger.error('Error handling reaction', e);
      return { status: 'error' };
    }
  }
}
