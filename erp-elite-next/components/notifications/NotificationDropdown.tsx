'use client';

import { useState } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface NotificationDropdownProps {
    userId: string;
}

export function NotificationDropdown({ userId }: NotificationDropdownProps) {
    const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications(userId);
    const [isOpen, setIsOpen] = useState(false);
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
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div className="relative w-8 h-8 flex items-center justify-center cursor-pointer text-gray-500 hover:text-gray-700">
                    <Bell className="text-black" size={25} strokeWidth={2} />

                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse">
                            {unreadCount}
                        </span>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-gray-700 text-sm">Notificaciones</h3>
                        {unreadCount > 0 && activeTab === 'unread' && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-xs text-blue-600 hover:text-blue-800 transition font-medium"
                            >
                                Marcar todas como leídas
                            </button>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 bg-gray-100 rounded-md p-1">
                        <button
                            onClick={() => setActiveTab('unread')}
                            className={cn(
                                "flex-1 px-3 py-1.5 text-xs font-medium rounded transition",
                                activeTab === 'unread'
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                            )}
                        >
                            No leídas {unreadCount > 0 && `(${unreadCount})`}
                        </button>
                        <button
                            onClick={() => setActiveTab('all')}
                            className={cn(
                                "flex-1 px-3 py-1.5 text-xs font-medium rounded transition",
                                activeTab === 'all'
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                            )}
                        >
                            Todas
                        </button>
                    </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                    {isLoading && filteredNotifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">Cargando...</div>
                    ) : filteredNotifications.length > 0 ? (
                        <ul>
                            {filteredNotifications.map((notification) => (
                                <li
                                    key={notification.id}
                                    className={cn(
                                        "relative p-3 border-b border-gray-100 last:border-none hover:bg-gray-50 transition cursor-pointer group",
                                        !notification.readAt && "bg-blue-50/50"
                                    )}
                                >
                                    {!notification.readAt && (
                                        <div className="absolute top-4 left-2 w-2 h-2 bg-blue-500 rounded-full"></div>
                                    )}

                                    <div className="ml-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-800 text-sm">{notification.title}</p>
                                                {/* <p className="text-gray-600 text-xs mt-1">{notification.message}</p> */}

                                                <div
                                                    className="prose prose-sm max-w-none text-gray-900"
                                                    dangerouslySetInnerHTML={{ __html: notification.message }}
                                                />

                                                {notification.data?.action_url && (
                                                    <Link
                                                        href={notification.data.action_url}
                                                        className="text-blue-600 text-xs hover:underline mt-1 inline-block"
                                                        onClick={() => setIsOpen(false)}
                                                    >
                                                        Ver detalles
                                                    </Link>
                                                )}

                                                <p className="text-[10px] text-gray-400 mt-2 flex items-center">
                                                    {formatDistanceToNow(new Date(notification.createdAt.endsWith('Z') ? notification.createdAt : `${notification.createdAt}Z`), { addSuffix: true, locale: es })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex space-x-2 mt-2 opacity-0 group-hover:opacity-100 transition">
                                            {!notification.readAt && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMarkAsRead(notification.id);
                                                    }}
                                                    className="text-xs text-blue-600 hover:text-blue-800 transition font-medium"
                                                >
                                                    Marcar como leída
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-8 text-center">
                            <div className="text-gray-300 mb-2 flex justify-center">
                                <Bell className="text-4xl text-gray-300" size={32} />
                            </div>
                            <p className="text-gray-500 text-sm">
                                {activeTab === 'unread' ? 'No tienes notificaciones sin leer' : 'No tienes notificaciones'}
                            </p>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
