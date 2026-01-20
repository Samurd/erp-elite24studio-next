import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/lib/services/notifications';
import { useSocket } from '@/components/providers/SocketProvider';
import { useEffect } from 'react';

export const useNotifications = (userId: string) => {
    const socket = useSocket();
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['notifications', userId],
        queryFn: () => notificationService.getAll(userId),
        enabled: !!userId,
    });

    const markAsReadMutation = useMutation({
        mutationFn: (id: number) => notificationService.markAsRead(id, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
        },
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: () => notificationService.markAllAsRead(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
        },
    });

    useEffect(() => {
        if (!socket || !userId) return;

        // Request notification permission on mount
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        socket.emit('joinNotifications', { userId });

        const handleNotification = (notification: any) => {
            // Invalidate queries to refetch
            queryClient.invalidateQueries({ queryKey: ['notifications', userId] });

            // Show native browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
                const notif = new Notification(notification.title, {
                    body: notification.message,
                    icon: '/favicon.ico',
                    badge: '/favicon.ico',
                    tag: `notification-${notification.id}`,
                    requireInteraction: false,
                });

                // Optional: Click handler to navigate to action URL
                if (notification.data?.action_url) {
                    notif.onclick = () => {
                        window.focus();
                        window.location.href = notification.data.action_url;
                        notif.close();
                    };
                }
            }
        };

        socket.on('notification', handleNotification);

        return () => {
            socket.emit('leaveNotifications', { userId });
            socket.off('notification', handleNotification);
        };
    }, [socket, userId, queryClient]);

    return {
        notifications: data?.notifications || [],
        unreadCount: data?.unreadCount || 0,
        isLoading,
        error,
        markAsRead: markAsReadMutation.mutate,
        markAllAsRead: markAllAsReadMutation.mutate,
    };
};
