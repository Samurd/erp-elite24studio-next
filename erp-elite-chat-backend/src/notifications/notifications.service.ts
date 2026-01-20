import { Injectable, Inject, Logger } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationsGateway } from './notifications.gateway';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../db/schema';
import { NatsJetStreamService } from '../nats/nats-jetstream.service';
import { DateService } from '../common/services/date.service';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, desc, and, count, lte, isNull } from 'drizzle-orm';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly gateway: NotificationsGateway,
    private readonly dateService: DateService,
    private readonly natsJetStreamService: NatsJetStreamService,
  ) { }

  async create(createNotificationDto: CreateNotificationDto) {
    const { userId, title, message, data, notifiableType, notifiableId } =
      createNotificationDto;

    const [notification] = await this.db
      .insert(schema.notifications)
      .values({
        userId,
        title,
        message,
        data,
        notifiableType,
        notifiableId,
        createdAt: this.dateService.now(),
        updatedAt: this.dateService.now(),
      })
      .returning();

    // Calculate unread count
    const unreadCount = await this.getUnreadCount(userId);

    // Convert BigInt to Number for JSON serialization
    const serializedNotification = {
      id: Number(notification.id),
      templateId: notification.templateId
        ? Number(notification.templateId)
        : null,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      notifiableType: notification.notifiableType,
      notifiableId: notification.notifiableId
        ? Number(notification.notifiableId)
        : null,
      readAt: notification.readAt,
      sentAt: notification.sentAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      unreadCount,
      sendEmail: createNotificationDto.sendEmail,
    };

    // Emit real-time event via NATS JetStream
    // this.gateway.sendNotification(userId, serializedNotification);
    await this.natsJetStreamService.publish('notifications.immediate', serializedNotification);

    return serializedNotification;
  }

  // Called by Consumer when 'notifications.immediate' message is received
  sendToGateway(notification: any) {
    this.logger.log(
      `Sending notification to gateway for user ${notification.userId}, title: ${notification.title}`,
    );
    this.gateway.sendNotification(notification.userId, notification);
    this.logger.log(
      `Notification sent to gateway for user ${notification.userId}`,
    );
  }

  async createTemplate(dto: any) {
    // Calculate nextSendAt based on type
    let nextSendAt: Date | string | null = null;

    if (dto.type === 'immediate') {
      nextSendAt = this.dateService.now();
    } else if (dto.type === 'scheduled' && dto.scheduledAt) {
      nextSendAt = new Date(dto.scheduledAt);
    } else if (dto.type === 'recurring') {
      // For recurring, if scheduledAt is provided, use it as the start.
      // If not, calculate the next occurrence based on the pattern immediately.
      if (dto.scheduledAt) {
        nextSendAt = new Date(dto.scheduledAt);
      } else {
        nextSendAt = this.calculateNextSendAt(dto);
      }
    } else if (dto.type === 'reminder' && dto.eventDate && dto.reminderDays) {
      const eventDate = new Date(dto.eventDate);
      nextSendAt = new Date(
        eventDate.getTime() - dto.reminderDays * 24 * 60 * 60 * 1000,
      );
    }

    // Called by Consumer when 'notifications.immediate' message is received




  }

  async updateTemplateByNotifiable(
    notifiableType: string,
    notifiableId: number,
    dto: any,
  ) {
    const existing = await this.db.query.notificationTemplates.findFirst({
      where: and(
        eq(schema.notificationTemplates.notifiableType, notifiableType),
        eq(schema.notificationTemplates.notifiableId, notifiableId),
      ),
    });

    if (!existing) {
      return null;
    }

    let nextSendAt = existing.nextSendAt;
    // Recalculate nextSendAt if relevant fields change
    if (dto.scheduledAt || dto.recurringPattern || dto.type) {
      const type = dto.type || existing.type;
      const scheduledAt = dto.scheduledAt || existing.scheduledAt;
      const recurringPattern =
        dto.recurringPattern || existing.recurringPattern;
      const reminderDays = dto.reminderDays || existing.reminderDays;
      const eventDate = dto.eventDate || existing.eventDate;

      if (type === 'immediate') {
        nextSendAt = this.dateService.now(); // Usually not updated to immediate but possible
      } else if (type === 'scheduled' && scheduledAt) {
        nextSendAt = new Date(scheduledAt).toISOString();
      } else if (type === 'recurring') {
        // If updating recurring, we might want to reset the next send to the new start date
        // OR keep the flow. Let's assume if scheduledAt is updated, we reset.
        if (scheduledAt) {
          nextSendAt = new Date(scheduledAt).toISOString();
        }
      } else if (type === 'reminder' && eventDate && reminderDays) {
        const evtDate = new Date(eventDate);
        nextSendAt = new Date(
          evtDate.getTime() - reminderDays * 24 * 60 * 60 * 1000,
        ).toISOString();
      }
    }

    const [updated] = await this.db
      .update(schema.notificationTemplates)
      .set({
        ...dto,
        notifiableId: undefined, // Protect
        notifiableType: undefined, // Protect
        nextSendAt: nextSendAt
          ? typeof nextSendAt === 'string'
            ? nextSendAt
            : (nextSendAt as Date).toISOString()
          : null,
        updatedAt: this.dateService.now(),
      })
      .where(eq(schema.notificationTemplates.id, existing.id))
      .returning();

    return updated;
  }

  async getTemplateByNotifiable(notifiableType: string, notifiableId: number) {
    return this.db.query.notificationTemplates.findFirst({
      where: and(
        eq(schema.notificationTemplates.notifiableType, notifiableType),
        eq(schema.notificationTemplates.notifiableId, notifiableId),
      ),
    });
  }

  async deleteTemplateByNotifiable(
    notifiableType: string,
    notifiableId: number,
  ) {
    return this.db
      .delete(schema.notificationTemplates)
      .where(
        and(
          eq(schema.notificationTemplates.notifiableType, notifiableType),
          eq(schema.notificationTemplates.notifiableId, notifiableId),
        ),
      );
  }
  async findAll(userId: string) {
    const list = await this.db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, userId))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(20);

    const unreadCount = await this.getUnreadCount(userId);

    // Serialize notifications to convert BigInt to Number
    const serializedList = list.map((notification) => ({
      id: Number(notification.id),
      templateId: notification.templateId
        ? Number(notification.templateId)
        : null,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      notifiableType: notification.notifiableType,
      notifiableId: notification.notifiableId
        ? Number(notification.notifiableId)
        : null,
      readAt: notification.readAt,
      sentAt: notification.sentAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    }));

    return {
      notifications: serializedList,
      unreadCount,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    const pending = await this.db
      .select()
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.userId, userId),
          isNull(schema.notifications.readAt),
        ),
      );

    return pending.length;
  }

  async markAsRead(id: number, userId: string) {
    await this.db
      .update(schema.notifications)
      .set({ readAt: this.dateService.now() })
      .where(
        and(
          eq(schema.notifications.id, Number(id)),
          eq(schema.notifications.userId, userId),
        ),
      );

    return { success: true };
  }

  async markAllAsRead(userId: string) {
    await this.db
      .update(schema.notifications)
      .set({ readAt: this.dateService.now() })
      .where(
        and(
          eq(schema.notifications.userId, userId),
          isNull(schema.notifications.readAt),
        ),
      );

    return { success: true };
  }

  // ==========================================
  // SCHEDULED NOTIFICATIONS PROCESSING
  // ==========================================

  async queueScheduledTemplates() {
    const now = this.dateService.now();

    // Get all active templates that are due for sending
    const dueTemplates = await this.db
      .select()
      .from(schema.notificationTemplates)
      .where(
        and(
          eq(schema.notificationTemplates.isActive, true),
          lte(schema.notificationTemplates.nextSendAt, now),
        ),
      );

    this.logger.log(`Found ${dueTemplates.length} due notification templates`);

    for (const template of dueTemplates) {
      try {
        // Publish to JetStream instead of processing directly
        await this.natsJetStreamService.publish(
          'notifications.process',
          template,
        );
      } catch (error) {
        this.logger.error(`Error queuing template ${template.id}:`, error);
      }
    }
  }

  async processTemplate(template: any) {
    // Create notification from template
    const [notification] = await this.db
      .insert(schema.notifications)
      .values({
        templateId: template.id,
        userId: template.userId,
        title: template.title,
        message: template.message,
        data: template.data,
        notifiableType: template.notifiableType,
        notifiableId: template.notifiableId,
        createdAt: this.dateService.now(),
        updatedAt: this.dateService.now(),
      })
      .returning();

    // Send notification
    const unreadCount = await this.getUnreadCount(template.userId);

    // Convert BigInt to Number for JSON serialization
    const serializedNotification = {
      id: Number(notification.id),
      templateId: notification.templateId
        ? Number(notification.templateId)
        : null,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      notifiableType: notification.notifiableType,
      notifiableId: notification.notifiableId
        ? Number(notification.notifiableId)
        : null,
      readAt: notification.readAt,
      sentAt: notification.sentAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      unreadCount,
      sendEmail: template.sendEmail,
    };

    this.gateway.sendNotification(template.userId, serializedNotification);

    // Update template
    await this.db
      .update(schema.notificationTemplates)
      .set({ lastSentAt: this.dateService.now() })
      .where(eq(schema.notificationTemplates.id, template.id));

    // Handle different template types
    if (template.type === 'recurring') {
      const nextSendAt = this.calculateNextSendAt(template);
      if (nextSendAt) {
        await this.db
          .update(schema.notificationTemplates)
          .set({ nextSendAt: nextSendAt.toISOString() })
          .where(eq(schema.notificationTemplates.id, template.id));
      } else {
        // Deactivate if no more occurrences
        await this.db
          .update(schema.notificationTemplates)
          .set({ isActive: false })
          .where(eq(schema.notificationTemplates.id, template.id));
      }
    } else if (template.type === 'scheduled' || template.type === 'reminder') {
      // One-time notifications - deactivate after sending
      await this.db
        .update(schema.notificationTemplates)
        .set({ isActive: false })
        .where(eq(schema.notificationTemplates.id, template.id));
    }

    this.logger.log(`Processed template ${template.id} (${template.type})`);
  }

  private calculateNextSendAt(template: any): Date | null {
    if (!template.recurringPattern) return null;

    const pattern = template.recurringPattern;
    const now = new Date();

    switch (pattern.interval) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        if (pattern.day) {
          nextMonth.setDate(pattern.day);
        }
        return nextMonth;
      case 'days':
        if (pattern.value) {
          return new Date(now.getTime() + pattern.value * 24 * 60 * 60 * 1000);
        }
        return null;
      case 'hours':
        if (pattern.value) {
          return new Date(now.getTime() + pattern.value * 60 * 60 * 1000);
        }
        return null;
      case 'minutes':
        if (pattern.value) {
          return new Date(now.getTime() + pattern.value * 60 * 1000);
        }
        return null;
      default:
        return null;
    }
  }
}
