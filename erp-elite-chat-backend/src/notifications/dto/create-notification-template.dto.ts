export class CreateNotificationTemplateDto {
    type: 'scheduled' | 'recurring' | 'reminder' | 'immediate';
    title: string;
    message: string;
    data?: Record<string, any>;
    userId: string;
    notifiableType?: string;
    notifiableId?: number;
    scheduledAt?: string; // ISO Date string
    recurringPattern?: {
        interval: 'daily' | 'weekly' | 'monthly' | 'days' | 'hours' | 'minutes';
        day?: number; // for monthly
        value?: number; // for days, hours, minutes
    };
    reminderDays?: number;
    eventDate?: string;
    sendEmail?: boolean;
    expiresAt?: string;
}
