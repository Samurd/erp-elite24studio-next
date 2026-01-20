import { auth } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface CreateNotificationDto {
    userId: string;
    title: string;
    message: string;
    data?: Record<string, any>;
    notifiableType?: string;
    notifiableId?: number;
    sendEmail?: boolean;
    emailTemplate?: 'approval-assigned' | 'meetings/created' | 'birthday' | 'new-message' | 'notification' | 'task-assigned' | 'team-invitation';
}

export interface CreateNotificationTemplateDto {
    type: 'scheduled' | 'recurring' | 'reminder' | 'immediate';
    title: string;
    message: string;
    data?: Record<string, any>;
    userId: string;
    notifiableType?: string;
    notifiableId?: number;
    scheduledAt?: string; // ISO Date string
    recurringPattern?: {
        interval: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'days' | 'hours' | 'minutes';
        day?: number; // for monthly/yearly
        month?: number; // for yearly
        value?: number; // for days, hours, minutes
    };
    reminderDays?: number;
    eventDate?: string;
    sendEmail?: boolean;
    emailTemplate?: string;
    isActive?: boolean;
    expiresAt?: string;
}

export class NotificationService {
    /**
     * Retrieves a notification template by notifiable.
     */
    static async getTemplateByNotifiable(notifiableType: string, notifiableId: number) {
        try {
            const params = new URLSearchParams({
                notifiableType,
                notifiableId: notifiableId.toString()
            });
            const res = await fetch(`${BACKEND_URL}/notifications/templates?${params}`);
            if (!res.ok) {
                if (res.status === 404) return null; // Not found is okay
                return null; // For now return null on error to avoid breaking UI
            }
            return await res.json();
        } catch (error) {
            console.error("Error fetching notification template:", error);
            return null;
        }
    }

    /**
     * Updates an existing notification template by notifiable.
     * @param notifiableType The type of the related entity
     * @param notifiableId The ID of the related entity
     * @param dto The data to update (Partial CreateNotificationTemplateDto)
     */
    static async updateTemplateByNotifiable(notifiableType: string, notifiableId: number, dto: Partial<CreateNotificationTemplateDto>) {
        try {
            const params = new URLSearchParams({
                notifiableType,
                notifiableId: notifiableId.toString()
            });
            const res = await fetch(`${BACKEND_URL}/notifications/templates?${params}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(dto),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to update notification template");
            }

            return await res.json();
        } catch (error) {
            console.error("Error updating notification template:", error);
            throw error;
        }
    }

    /**
     * Deletes a notification template by notifiable.
     */
    static async deleteTemplateByNotifiable(notifiableType: string, notifiableId: number) {
        try {
            const params = new URLSearchParams({
                notifiableType,
                notifiableId: notifiableId.toString()
            });
            const res = await fetch(`${BACKEND_URL}/notifications/templates?${params}`, {
                method: "DELETE"
            });
            if (!res.ok) {
                // If 404, it's already gone, consider success
                if (res.status === 404) return true;
                return false;
            }
            return true;
        } catch (error) {
            console.error("Error deleting notification template:", error);
            return false;
        }
    }

    /**
     * Creates a new notification template in the backend.
     * Use this for scheduled, recurring, or reminder notifications.
     * 
     * @param dto The template data to create
     * @example
     * // Recurring Monthly
     * await NotificationService.createTemplate({
     *   type: 'recurring',
     *   title: 'Renew Subscription',
     *   message: 'Your subscription is expiring',
     *   userId: '123',
     *   scheduledAt: '2024-01-01T00:00:00Z',
     *   recurringPattern: { interval: 'monthly', day: 1 }
     * });
     * 
     * @example
     * // Scheduled Once
     * await NotificationService.createTemplate({
     *   type: 'scheduled',
     *   title: 'Meeting Reminder',
     *   message: 'Meeting in 1 hour',
     *   userId: '123',
     *   scheduledAt: '2024-01-01T10:00:00Z'
     * });
     */
    static async createTemplate(dto: CreateNotificationTemplateDto) {
        try {
            // Map emailTemplate to data.email_template for backend
            const { emailTemplate, ...rest } = dto;
            const payload = {
                ...rest,
                data: {
                    ...rest.data,
                    ...(emailTemplate ? { email_template: emailTemplate } : {}),
                }
            };

            const res = await fetch(`${BACKEND_URL}/notifications/templates`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to create notification template");
            }

            return await res.json();
        } catch (error) {
            console.error("Error creating notification template:", error);
            throw error;
        }
    }

    /**
     * Creates a new IMMEDIATE notification.
     * This will effectively send the notification to the user right away (real-time + db).
     * Use createTemplate for scheduled or recurring notifications.
     * 
     * @param dto The notification data
     * @example
     * await NotificationService.createNotification({
     *   userId: '123',
     *   title: 'Hello',
     *   message: 'Welcome to the platform',
     *   emailTemplate: 'new-message'
     * });
     */
    static async createNotification(dto: CreateNotificationDto) {
        try {
            // Map emailTemplate to data.email_template for backend
            const { emailTemplate, ...rest } = dto;
            const payload = {
                ...rest,
                data: {
                    ...rest.data,
                    ...(emailTemplate ? { email_template: emailTemplate } : {}),
                }
            };

            const res = await fetch(`${BACKEND_URL}/notifications`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to create notification");
            }

            return await res.json();
        } catch (error) {
            console.error("Error creating notification:", error);
            throw error;
        }
    }
}
