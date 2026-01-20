const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type Notification = {
    id: number;
    userId: string;
    title: string;
    message: string;
    data?: any;
    readAt?: string;
    createdAt: string;
};

export const notificationService = {
    async getAll(userId: string) {
        const res = await fetch(`${API_URL}/notifications/${userId}`);
        if (!res.ok) throw new Error('Failed to fetch notifications');
        return res.json() as Promise<{ notifications: Notification[], unreadCount: number }>;
    },

    async markAsRead(id: number, userId: string) {
        const res = await fetch(`${API_URL}/notifications/${id}/read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });
        if (!res.ok) throw new Error('Failed to mark notification as read');
        return res.json();
    },

    async markAllAsRead(userId: string) {
        const res = await fetch(`${API_URL}/notifications/read-all`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });
        if (!res.ok) throw new Error('Failed to mark all notifications as read');
        return res.json();
    },
};
