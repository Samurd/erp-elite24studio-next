'use client';

import { useState } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface UserNotificationsViewProps {
    userId: string;
}

export default function UserNotificationsView({ userId }: UserNotificationsViewProps) {
    const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications(userId);
    const [activeTab, setActiveTab] = useState<'unread' | 'all'>('unread');

    const handleMarkAsRead = (id: number) => {
        markAsRead(id);
    };

    const handleMarkAllAsRead = () => {
        markAllAsRead();
    };

    // Filter notifications based on active tab
    const filteredNotifications = activeTab === 'unread'
        ? notifications.filter(n => !n.readAt)
        : notifications;

    return (
        <div className="max-w-4xl mx-auto mt-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Bell className="text-yellow-700" size={20} />
                        </div>
                        <h2 className="font-bold text-gray-800 text-lg">Tus Notificaciones</h2>
                    </div>

                    <div className="flex items-center gap-3">
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-sm text-blue-600 hover:text-blue-800 transition font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50"
                            >
                                Marcar todas como leídas
                            </button>
                        )}

                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab('unread')}
                                className={cn(
                                    "px-4 py-1.5 text-sm font-medium rounded-md transition",
                                    activeTab === 'unread'
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-900"
                                )}
                            >
                                No leídas {unreadCount > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                            </button>
                            <button
                                onClick={() => setActiveTab('all')}
                                className={cn(
                                    "px-4 py-1.5 text-sm font-medium rounded-md transition",
                                    activeTab === 'all'
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-900"
                                )}
                            >
                                Todas
                            </button>
                        </div>
                    </div>
                </div>

                <div className="divide-y divide-gray-100 min-h-[400px]">
                    {isLoading && filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mb-2"></div>
                            Cargando notificaciones...
                        </div>
                    ) : filteredNotifications.length > 0 ? (
                        <ul>
                            {filteredNotifications.map((notification) => (
                                <li
                                    key={notification.id}
                                    className={cn(
                                        "group relative p-6 hover:bg-gray-50 transition duration-200",
                                        !notification.readAt ? "bg-blue-50/30" : ""
                                    )}
                                >
                                    <div className="flex gap-4">
                                        <div className={cn(
                                            "mt-1 w-2 h-2 rounded-full flex-shrink-0",
                                            !notification.readAt ? "bg-blue-500" : "bg-transparent"
                                        )}></div>

                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                                                <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                                                    {formatDistanceToNow(new Date(notification.createdAt.endsWith('Z') ? notification.createdAt : `${notification.createdAt}Z`), { addSuffix: true, locale: es })}
                                                </span>
                                            </div>

                                            <div
                                                className="prose prose-sm max-w-none text-gray-600 mb-3"
                                                dangerouslySetInnerHTML={{ __html: notification.message }}
                                            />

                                            <div className="flex items-center justify-between mt-4">
                                                {notification.data?.action_url ? (
                                                    <Link
                                                        href={notification.data.action_url}
                                                        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                                                    >
                                                        Ver detalles
                                                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </Link>
                                                ) : <div></div>}

                                                {!notification.readAt && (
                                                    <button
                                                        onClick={() => handleMarkAsRead(notification.id)}
                                                        className="text-xs border border-gray-200 hover:border-blue-200 text-gray-500 hover:text-blue-600 bg-white hover:bg-blue-50 px-3 py-1.5 rounded-full transition opacity-0 group-hover:opacity-100"
                                                    >
                                                        Marcar como leída
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-16 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                                <Bell size={32} />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">Sin notificaciones</h3>
                            <p className="text-gray-500">
                                {activeTab === 'unread'
                                    ? '¡Estás al día! No tienes notificaciones sin leer.'
                                    : 'No tienes ninguna notificación en tu historial.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
