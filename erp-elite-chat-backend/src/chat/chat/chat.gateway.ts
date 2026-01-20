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
import { Logger } from '@nestjs/common';
import { ChatService } from '../services/chat.service';
import { ChannelService } from '../services/channel.service';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ChatGateway');

  // Track connected users: userId -> Set of socket IDs
  private connectedUsers: Map<string, Set<string>> = new Map();

  constructor(
    private readonly chatService: ChatService,
    private readonly channelService: ChannelService,
  ) { }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // TODO: Auth check using client.handshake.headers.authorization or cookie
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Find and remove user from connected users
    for (const [userId, socketIds] of this.connectedUsers.entries()) {
      if (socketIds.has(client.id)) {
        socketIds.delete(client.id);

        // If user has no more connections, emit offline status
        if (socketIds.size === 0) {
          this.connectedUsers.delete(userId);
          this.server.emit('userOffline', { userId });
          this.logger.log(`User ${userId} is now offline`);
        }
        break;
      }
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { room: string; userId?: string },
  ) {
    client.join(payload.room);
    this.logger.log(`Client ${client.id} joined ${payload.room}`);

    // Track user connection if userId provided
    if (payload.userId) {
      if (!this.connectedUsers.has(payload.userId)) {
        this.connectedUsers.set(payload.userId, new Set());
        // Emit online status only when first connection
        this.server.emit('userOnline', { userId: payload.userId });
        this.logger.log(`User ${payload.userId} is now online`);
      }
      this.connectedUsers.get(payload.userId)!.add(client.id);
    }

    return { event: 'joinedRoom', room: payload.room };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { room: string },
  ) {
    client.leave(payload.room);
    this.logger.log(`Client ${client.id} left ${payload.room}`);
    return { event: 'leftRoom', room: payload.room };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      content: string;
      roomId: string;
      userId: string;
      fileIds?: number[];
      parentId?: number;
    },

  ) {
    try {
      const [type, idStr] = payload.roomId.split(':');
      const id = parseInt(idStr, 10);
      let result;

      if (type === 'channel') {
        result = await this.channelService.sendMessage({
          ...payload,
          channelId: id,
        });
      } else if (type === 'private') {
        result = await this.chatService.sendMessage({
          ...payload,
        });
      } else {
        throw new Error('Invalid room type');
      }

      console.log('📤 Broadcasting message:', JSON.stringify(result.message, null, 2));

      // Broadcast to entire room INCLUDING sender
      this.server.to(payload.roomId).emit('newMessage', result.message);

      // Also emit a global event for unread notifications (for TeamSidebar)
      if (type === 'channel') {
        this.server.emit('channelMessageNotification', {
          channelId: id,
          userId: payload.userId,
          messageId: result.message.id
        });
      }

      return result;
    } catch (error) {
      this.logger.error('Error sending message', error);
      return { status: 'error', message: error.message };
    }
  }

  @SubscribeMessage('messageReaction')
  async handleMessageReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; messageId: number; userId: string; emoji: string; action: 'add' | 'remove' },
  ) {
    const { roomId } = payload;
    this.logger.log(`Reaction ${payload.action} on msg ${payload.messageId} by ${payload.userId}: ${payload.emoji}`);

    try {
      const payloadToSend = await this.chatService.handleReaction(payload);

      console.log('📤 Broadcasting reaction update:', JSON.stringify(payloadToSend, null, 2));

      client.to(roomId).emit('reactionUpdated', payloadToSend);
      // Also emit back to sender
      client.emit('reactionUpdated', payloadToSend);

      return { status: 'ok', data: payloadToSend };

    } catch (error) {
      this.logger.error('Error handling reaction', error);
      return { status: 'error' };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { room: string; isTyping: boolean; userName: string },
  ) {
    client.to(payload.room).emit('typing', payload);
  }

  @SubscribeMessage('getOnlineStatus')
  handleGetOnlineStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: string },
  ) {
    const isOnline = this.connectedUsers.has(payload.userId);
    return { userId: payload.userId, isOnline };
  }
}
