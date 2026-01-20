import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsWatcher implements OnApplicationBootstrap {
    private readonly logger = new Logger(NotificationsWatcher.name);

    constructor(private readonly notificationsService: NotificationsService) { }

    onApplicationBootstrap() {
        // Run every minute
        setInterval(() => this.handleScheduledNotifications(), 60000);
        this.logger.debug('NotificationsWatcher initialized');
    }

    async handleScheduledNotifications() {
        try {
            this.logger.debug('Checking for scheduled notifications...');
            await this.notificationsService.queueScheduledTemplates();
        } catch (error) {
            this.logger.error('Error processing scheduled notifications:', error);
        }
    }
}
