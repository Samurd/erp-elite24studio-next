export class CreateNotificationDto {
    userId: string;
    title: string;
    message: string;
    data?: Record<string, any>;
    notifiableType?: string;
    notifiableId?: number;
    sendEmail?: boolean;
}
