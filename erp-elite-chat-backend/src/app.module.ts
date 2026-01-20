import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ChatGateway } from './chat/chat/chat.gateway';
import { NotificationsModule } from './notifications/notifications.module';
// import { ScheduleModule } from '@nestjs/schedule';
import { CommonModule } from './common/common.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NatsJetStreamModule } from './nats/nats-jetstream.module';

import { ChatService } from './chat/services/chat.service';
import { ChannelService } from './chat/services/channel.service';

import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    // ScheduleModule.removed(),
    ClientsModule.register([
      {
        name: 'NATS_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_SERVER_URL || 'nats://localhost:4222'],
        },
      },
    ]),
    NatsJetStreamModule,
    NotificationsModule,
    CommonModule
  ],
  controllers: [AppController],
  providers: [AppService, ChatGateway, ChatService, ChannelService],
})
export class AppModule { }
