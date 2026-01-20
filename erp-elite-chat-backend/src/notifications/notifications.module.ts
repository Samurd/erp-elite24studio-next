import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsWatcher } from './notifications.watcher';
import { NotificationsConsumer } from './notifications.consumer';
import { DatabaseModule } from '../database/database.module';
import { NatsJetStreamModule } from '../nats/nats-jetstream.module';
import { EmailModule } from '../emails/email.module';

@Module({
    imports: [DatabaseModule, NatsJetStreamModule, EmailModule],
    controllers: [NotificationsController],
    providers: [NotificationsService, NotificationsGateway, NotificationsWatcher, NotificationsConsumer],
    exports: [NotificationsService],
})
export class NotificationsModule { }
