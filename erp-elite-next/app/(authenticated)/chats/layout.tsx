'use client';

import { ReactNode, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';
import { useSocket } from '@/components/providers/SocketProvider';
import { Badge } from '@/components/ui/badge';
import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface ChatUser {
    userId: string;
    name: string;
    avatar?: string;
    chatId: number | null;
    unreadCount?: number;
    lastMessage?: {
        content: string;
        createdAt: string;
    };
}

export default function ChatsLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const queryClient = useQueryClient();
    const { data: session } = authClient.useSession();
    const socket = useSocket();

    const currentUserId = session?.user?.id;

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const { data: users, isLoading } = useQuery<ChatUser[]>({
        queryKey: ['chats-users', currentUserId, debouncedSearch],
        queryFn: async () => {
            if (!currentUserId) throw new Error('No user session');
            const params = new URLSearchParams();
            params.set('userId', currentUserId);
            if (debouncedSearch) {
                params.set('search', debouncedSearch);
            }

            const res = await fetch(`/api/chats?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch chats');
            return res.json();
            // Data is already sorted by API
        },
        enabled: !!currentUserId,
    });

    // Listen for new messages via Socket.IO to update chat list
    useEffect(() => {
        if (!socket || !currentUserId) return;

        socket.on('newMessage', (msg: any) => {
            // Update the chat list when a new message arrives
            queryClient.setQueryData<ChatUser[]>(['chats-users', currentUserId, debouncedSearch], (oldData) => {
                if (!oldData) return oldData;

                // If we are searching, we might not want to mess with the list too much, 
                // but if a message comes in for a user in the search result, we should probably update it.
                // However, standard active chat list update logic applies best when not searching.
                // For simplified logic: if searching, maybe valid to just invalidate or ignore real-time sort 
                // to avoid UI jumping while typing.
                if (debouncedSearch) return oldData;

                return oldData.map(user => {
                    // Find the chat that received the message
                    if (user.chatId && msg.privateChatId === user.chatId) {
                        return {
                            ...user,
                            lastMessage: {
                                content: msg.content,
                                createdAt: msg.createdAt,
                            },
                            // Increment unread count if message is from other user
                            unreadCount: msg.userId !== currentUserId
                                ? (user.unreadCount || 0) + 1
                                : user.unreadCount,
                        };
                    }
                    return user;
                }).sort((a, b) => {
                    // Re-sort by latest message
                    const aTime = a.lastMessage?.createdAt || '';
                    const bTime = b.lastMessage?.createdAt || '';
                    return bTime.localeCompare(aTime);
                });
            });

            // Also invalidate to be sure? No, optimistic update is better.
        });

        return () => {
            socket.off('newMessage');
        };
    }, [socket, currentUserId, queryClient, debouncedSearch]);

    const createChatMutation = useMutation({
        mutationFn: async (targetUserId: string) => {
            if (!currentUserId) throw new Error('No user session');
            const res = await fetch('/api/chats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentUserId, targetUserId }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create chat');
            }
            return res.json();
        },
        onSuccess: (data) => {
            // Clear search after creating chat to show active chats
            setSearch('');
            setDebouncedSearch('');
            queryClient.invalidateQueries({ queryKey: ['chats-users'] });
            router.push(`/chats/${data.chatId}`);
        },
    });

    const handleUserClick = (user: ChatUser) => {
        // Reset unread count when opening chat
        if (user.unreadCount && user.unreadCount > 0) {
            queryClient.setQueryData<ChatUser[]>(['chats-users', currentUserId, debouncedSearch], (oldData) => {
                if (!oldData) return oldData;
                return oldData.map(u =>
                    u.userId === user.userId ? { ...u, unreadCount: 0 } : u
                );
            });
        }

        if (user.chatId) {
            router.push(`/chats/${user.chatId}`);
            // Optional: Clear search if we clicked an existing chat result?
            // usually nice to keep context, but if it came from search maybe clear.
            // letting it stay for now.
        } else {
            createChatMutation.mutate(user.userId);
        }
    };

    return (
        <div className="flex h-[calc(95vh-4rem)] w-full gap-4 p-4">
            <Card className="w-80 flex flex-col h-full">
                <CardHeader className="space-y-3 pb-4">
                    <CardTitle>Chats</CardTitle>
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar usuarios..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="flex flex-col">
                            {!currentUserId && <div className="p-4 text-sm text-muted-foreground">Cargando sesión...</div>}
                            {isLoading && currentUserId && <div className="p-4 text-sm text-muted-foreground">Cargando...</div>}
                            {users?.map((user) => (
                                <div
                                    key={user.userId}
                                    onClick={() => handleUserClick(user)}
                                    className={cn(
                                        "flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors border-b last:border-0 cursor-pointer",
                                        createChatMutation.isPending && "opacity-50 pointer-events-none",
                                        pathname === `/chats/${user.chatId}` && "bg-primary/10 border-l-4 border-l-primary"
                                    )}
                                >
                                    <Avatar className="h-10 w-10 ">
                                        <AvatarImage src={user.avatar || ''} />
                                        <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="font-medium truncate flex justify-between items-center">
                                            <span>{user.name}</span>
                                            <div className="flex items-center gap-2">
                                                {user.unreadCount && user.unreadCount > 0 && (
                                                    <Badge variant="default" className="h-5 min-w-5 px-1.5 text-xs">
                                                        {user.unreadCount > 99 ? '99+' : user.unreadCount}
                                                    </Badge>
                                                )}
                                                {user.lastMessage && <span className="text-[10px] text-muted-foreground font-normal">{new Date(user.lastMessage.createdAt).toLocaleDateString()}</span>}
                                            </div>
                                        </div>
                                        {user.lastMessage ? (
                                            <div className="text-xs text-muted-foreground truncate">
                                                {user.lastMessage.content}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-muted-foreground italic">
                                                Iniciar conversación
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {users?.length === 0 && (
                                <div className="p-4 text-sm text-muted-foreground">No se encontraron usuarios.</div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <div className="flex-1 h-full">
                {children}
            </div>
        </div>
    );
}


