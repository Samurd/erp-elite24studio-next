import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject } from '@nestjs/common';
import { EmailService } from '../emails/email.service';
import { DATABASE_CONNECTION } from '../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';

@WebSocketGateway({ cors: true })
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly emailService: EmailService,
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) { }
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('NotificationsGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinNotifications')
  handleJoinNotifications(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: string },
  ) {
    const room = `notifications:${payload.userId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined ${room}`);
    return { event: 'joinedNotifications', room };
  }

  @SubscribeMessage('leaveNotifications')
  handleLeaveNotifications(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: string },
  ) {
    const room = `notifications:${payload.userId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left ${room}`);
    return { event: 'leftNotifications', room };
  }

  async sendNotification(userId: string, notification: any) {
    const room = `notifications:${userId}`;
    this.server.to(room).emit('notification', notification);
    this.logger.log(`Notification sent to room ${room}: ${notification.title}`);

    try {
      this.logger.log(`Looking up user with ID: ${userId}`);
      const [user] = await this.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, userId));

      if (!user) {
        this.logger.warn(`User with ID ${userId} not found`);
        return;
      }

      if (!user.email) {
        this.logger.warn(`User ${userId} has no email or workEmail set`);
        return;
      }

      // Check if email sending is disabled for this notification
      // Defaults to true if undefined, to maintain backward compatibility and "it works" behavior
      if (notification.sendEmail === false) {
        this.logger.log(
          `Email sending disabled for notification ${notification.id}`,
        );
        return;
      }

      const email = user.email; // Prioritize email
      this.logger.log(`Sending email to ${email} for user ${userId}`);

      // Heuristic for template selection
      let template = 'notification';
      const lowerTitle = notification.title?.toLowerCase() || '';

      if (notification.data?.email_template) {
        template = notification.data.email_template;
        this.logger.log(`Using specified template: ${template}`);
      } else if (notification.data?.approval_name) {
        template = 'approval-assigned';
      } else if (notification.data?.meeting) {
        template = 'meetings/created';
      } else if (
        lowerTitle.includes('birthday') ||
        lowerTitle.includes('cumpleaños')
      ) {
        template = 'birthday';
      } else if (
        lowerTitle.includes('message') ||
        lowerTitle.includes('mensaje')
      ) {
        template = 'new-message';
        this.logger.log(
          `Detected message notification, using template: ${template}`,
        );
      } else if (lowerTitle.includes('task') || lowerTitle.includes('tarea')) {
        template = 'task-assigned';
      } else if (
        lowerTitle.includes('team') ||
        lowerTitle.includes('equipo') ||
        lowerTitle.includes('invitación')
      ) {
        template = 'team-invitation';
      }

      const context = {
        title: notification.title,
        body: notification.message,
        ...notification.data,
        actionUrl: notification.data?.actionUrl || process.env.FRONTEND_URL,
      };

      this.logger.log(`Sending email with template "${template}" to ${email}`);
      const result = await this.emailService.sendEmail(
        email,
        notification.title,
        template,
        context,
      );
      this.logger.log(
        `Email sent successfully to ${email}:`,
        result?.messageId,
      );
    } catch (error) {
      this.logger.error(`Error sending email to user ${userId}`, error);
      // Log more details about the error
      if (error.code) {
        this.logger.error(`Email error code: ${error.code}`);
      }
      if (error.response) {
        this.logger.error(`Email error response: ${error.response}`);
      }
    }


  }
}
