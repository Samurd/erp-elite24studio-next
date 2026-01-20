import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NatsJetStreamService } from '../nats/nats-jetstream.service';

@Injectable()
export class NotificationsConsumer implements OnApplicationBootstrap {
    private readonly logger = new Logger(NotificationsConsumer.name);

    constructor(
        private readonly notificationsService: NotificationsService,
        private readonly natsJetStreamService: NatsJetStreamService,
    ) { }

    onApplicationBootstrap() {
        this.natsJetStreamService.consume('notifications.process', async (data) => {
            this.logger.debug(`Received notification job for template ${data.id}`);
            await this.notificationsService.processTemplate(data);
        });

        this.natsJetStreamService.consume('notifications.immediate', async (data) => {
            this.logger.debug(`Received immediate notification for user ${data.userId}`);
            this.notificationsService.sendToGateway(data);
        });
        this.logger.log('NotificationsConsumer started');
    }
}
