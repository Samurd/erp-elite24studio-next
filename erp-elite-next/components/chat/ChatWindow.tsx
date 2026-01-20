'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useSocket } from '../providers/SocketProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Smile, Paperclip, Circle, Clock, Check, CheckCheck } from 'lucide-react';
import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import ModelAttachmentsCreator from '@/components/cloud/ModelAttachmentsCreator';
import { uploadFile } from '@/actions/files';

interface ChatWindowProps {
    roomId: string; // e.g., 'channel:1' or 'private:1'
    title: string;
}

export default function ChatWindow({ roomId, title }: ChatWindowProps) {
    const socket = useSocket();
    const queryClient = useQueryClient();
    const { data: session } = authClient.useSession();
    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showAttachments, setShowAttachments] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const [pendingCloudFiles, setPendingCloudFiles] = useState<any[]>([]);
    const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const currentUserId = session?.user?.id;

    // Parse ID from roomId (e.g., 'private:5' -> 5)
    const isPrivate = roomId.startsWith('private:');
    const numericId = roomId.split(':')[1];

    // console.log('🔍 ChatWindow Debug:', { roomId, isPrivate, numericId });

    // Fetch chat info to get other user details
    const { data: chatInfo } = useQuery({
        queryKey: ['chat-info', numericId, currentUserId],
        queryFn: async () => {
            if (!currentUserId) return null;
            const res = await fetch(`/api/chats/${numericId}?userId=${currentUserId}`);
            if (!res.ok) return null;
            return res.json();
        },
        enabled: !!numericId && !!currentUserId && isPrivate,
    });

    const otherUser = chatInfo?.otherUser;

    // Check initial online status when otherUser is loaded
    useEffect(() => {
        if (socket && otherUser?.id) {
            socket.emit('getOnlineStatus', { userId: otherUser.id }, (response: any) => {
                if (response?.isOnline !== undefined) {
                    setIsOtherUserOnline(response.isOnline);
                }
            });
        }
    }, [socket, otherUser?.id]);

    // Fetch initial messages with infinite query for pagination
    const {
        data: messagesData,
        isLoading,
        error: messagesError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInfiniteQuery({
        queryKey: ['messages', roomId],
        queryFn: async ({ pageParam }) => {
            const type = isPrivate ? 'private' : 'channel';
            const url = new URL(`/api/chats/${numericId}/messages`, window.location.origin);
            url.searchParams.set('type', type);
            if (pageParam) {
                url.searchParams.set('beforeId', pageParam.toString());
            }

            const res = await fetch(url.toString());
            if (!res.ok) {
                const errorText = await res.text();
                // console.error('❌ Failed to fetch messages:', errorText);
                throw new Error('Failed to fetch messages');
            }
            const data = await res.json();
            return data;
        },
        getNextPageParam: (lastPage) => {
            return lastPage.hasMore ? lastPage.nextCursor : undefined;
        },
        initialPageParam: undefined,
        enabled: !!numericId,
    });

    // console.log('Messages state:', { messagesData, isLoading, messagesError });

    const [messages, setMessages] = useState<any[]>([]);

    // Flatten all pages into a single messages array and deduplicate by ID
    const allMessages = useMemo(() => {
        const flattened = messagesData?.pages.flatMap(page => page.messages) || [];
        // Deduplicate by ID
        const seen = new Set();
        return flattened.filter((msg: any) => {
            if (seen.has(msg.id)) return false;
            seen.add(msg.id);
            return true;
        });
    }, [messagesData?.pages]);

    // Sync state with fetched messages
    useEffect(() => {
        if (allMessages.length > 0) {
            // console.log('🔄 Syncing messages to state:', allMessages.length, 'messages');
            // Add 'delivered' status to messages from API (they're already in DB)
            const messagesWithStatus = allMessages.map(msg => ({
                ...msg,
                status: msg.status || 'delivered'
            }));
            setMessages(messagesWithStatus);
            // Only scroll to bottom on initial load (when we have exactly one page)
            if (messagesData?.pages.length === 1) {
                setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }
        }
    }, [allMessages.length, messagesData?.pages.length]);

    // Scroll detection for loading more messages
    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer) return;

        const handleScroll = () => {
            const viewport = scrollContainer.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
            if (!viewport) return;

            const scrollTop = viewport.scrollTop;

            // Load more when scrolled near the top (within 200px)
            if (scrollTop < 200 && hasNextPage && !isFetchingNextPage) {
                const previousScrollHeight = viewport.scrollHeight;
                const previousScrollTop = viewport.scrollTop;

                fetchNextPage().then(() => {
                    // Maintain scroll position after loading
                    requestAnimationFrame(() => {
                        const newScrollHeight = viewport.scrollHeight;
                        viewport.scrollTop = newScrollHeight - previousScrollHeight + previousScrollTop;
                    });
                });
            }
        };

        const viewport = scrollContainer.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.addEventListener('scroll', handleScroll);
            return () => viewport.removeEventListener('scroll', handleScroll);
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    useEffect(() => {
        if (!socket) {
            // console.log('⏳ Socket not ready yet for room:', roomId);
            return;
        }

        // console.log('🔌 Joining room:', roomId);

        // Join room with userId for online status tracking
        socket.emit('joinRoom', { room: roomId, userId: currentUserId });

        // Listen for new messages
        socket.on('newMessage', (msg) => {
            // console.log('📨 Received newMessage event:', msg);
            // console.log('Current userId:', currentUserId, 'Message userId:', msg.userId);

            // Only add messages from OTHER users (not our own)
            if (msg.userId !== currentUserId) {
                // console.log('✅ Adding message from other user to UI');
                setMessages((prev) => [...prev, { ...msg, status: 'delivered' }]);

                // Update infinite query cache
                queryClient.setQueryData(['messages', roomId], (oldData: any) => {
                    if (!oldData?.pages) return oldData;
                    return {
                        ...oldData,
                        pages: oldData.pages.map((page: any, idx: number) =>
                            idx === oldData.pages.length - 1
                                ? { ...page, messages: [...page.messages, msg] }
                                : page
                        )
                    };
                });

                // Auto scroll
                if (scrollRef.current) {
                    scrollRef.current.scrollIntoView({ behavior: 'smooth' });
                }
            } else {
                // Our own message came back from server - update with full server data including files
                setMessages((prev) => prev.map(m =>
                    // Match by content and userId since temp ID won't match server ID
                    (m.content === msg.content && m.userId === msg.userId && m.status !== 'delivered')
                        ? { ...msg, status: 'delivered' } // Use server message with all data (files, etc.)
                        : m
                ));
            }
        });

        // Listen for typing indicator
        socket.on('typing', (data: { isTyping: boolean; userName: string }) => {
            // console.log('⌨️ Typing event:', data);
            setIsTyping(data.isTyping);
        });

        // Listen for user online status
        socket.on('userOnline', (data: { userId: string }) => {
            if (data.userId === otherUser?.id) {
                setIsOtherUserOnline(true);
            }
        });

        // Listen for user offline status
        socket.on('userOffline', (data: { userId: string }) => {
            if (data.userId === otherUser?.id) {
                setIsOtherUserOnline(false);
            }
        });

        return () => {
            // console.log('👋 Leaving room:', roomId);
            socket.emit('leaveRoom', { room: roomId });
            socket.off('newMessage');
            socket.off('typing');
            socket.off('userOnline');
            socket.off('userOffline');
        };
    }, [socket, roomId, queryClient, currentUserId, otherUser?.id]);

    const handleSendMessage = async () => {
        if ((!inputText.trim() && attachedFiles.length === 0 && pendingCloudFiles.length === 0) || !currentUserId || !socket || isSending) return;

        setIsSending(true);

        try {
            // 1. Upload local files first
            const uploadedFileIds: number[] = [];
            if (attachedFiles.length > 0) {
                for (const file of attachedFiles) {
                    const formData = new FormData();
                    formData.append('file', file);
                    const res = await uploadFile(formData);
                    if (res.success && res.file) {
                        uploadedFileIds.push(res.file.id);
                    }
                }
            }

            // 2. Collect cloud file IDs
            const cloudFileIds = pendingCloudFiles.map(f => f.id);
            const allFileIds = [...uploadedFileIds, ...cloudFileIds];

            // 3. Create optimistic message
            const tempMessage = {
                id: Date.now(),
                content: inputText,
                userId: currentUserId,
                userName: session?.user?.name || 'You',
                userEmail: session?.user?.email || '',
                type: 'text',
                createdAt: new Date().toISOString(),
                files: allFileIds.length > 0 ? allFileIds.map(id => ({ id })) : undefined,
                status: 'pending', // pending, sent, delivered
            };

            // Add message to UI immediately (optimistic update)
            setMessages((prev) => [...prev, tempMessage]);

            const socketPayload = {
                content: inputText,
                roomId,
                userId: currentUserId,
                fileIds: allFileIds.length > 0 ? allFileIds : undefined,
            };
            // console.log('📤 Sending to Socket.IO:', socketPayload);

            socket.emit('sendMessage', socketPayload, (response: any) => {
                // Update message status to 'sent' when server confirms
                if (response?.status === 'ok') {
                    setMessages((prev) => prev.map(m =>
                        m.id === tempMessage.id ? { ...m, status: 'sent', id: response.message?.id || m.id } : m
                    ));
                }
            });

            // Clear input and attachments
            setInputText('');
            setAttachedFiles([]);
            setPendingCloudFiles([]);
            setShowAttachments(false);

            // Auto scroll to bottom
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } catch (error) {
            // console.error('Error sending message:', error);
        } finally {
            setIsSending(false);
        }
    };

    // Handle typing indicator
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputText(e.target.value);

        if (!socket) return;

        // Emit typing event
        socket.emit('typing', {
            room: roomId,
            isTyping: true,
            userName: session?.user?.name || 'Someone',
        });

        // Clear previous timeout
        if (typingTimeout) clearTimeout(typingTimeout);

        // Stop typing after 2 seconds of inactivity
        const timeout = setTimeout(() => {
            socket.emit('typing', {
                room: roomId,
                isTyping: false,
                userName: session?.user?.name || 'Someone',
            });
        }, 2000);

        setTypingTimeout(timeout);
    };

    // Handle emoji selection
    const handleEmojiClick = (emojiData: EmojiClickData) => {
        setInputText((prev) => prev + emojiData.emoji);
        setShowEmojiPicker(false);
    };

    return (
        <Card className="flex flex-col h-full border-0 shadow-none rounded-none">
            <CardHeader className="border-b px-4 py-3">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={otherUser?.image || ''} />
                        <AvatarFallback>
                            {otherUser?.name?.substring(0, 2).toUpperCase() || 'CH'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h3 className="font-semibold text-sm">
                            {otherUser?.name || title}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            {isTyping ? (
                                <span className="text-primary">escribiendo...</span>
                            ) : (
                                <>
                                    <Circle className={`w-2 h-2 ${isOtherUserOnline ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'}`} />
                                    <span>{isOtherUserOnline ? 'En línea' : 'Desconectado'}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden relative">
                <ScrollArea className="h-full p-4" ref={scrollContainerRef}>
                    <div className="space-y-4">
                        {/* Loading indicator for older messages */}
                        {isFetchingNextPage && (
                            <div className="text-center text-sm text-muted-foreground py-2">
                                Cargando mensajes antiguos...
                            </div>
                        )}
                        {hasNextPage && !isFetchingNextPage && messages.length > 0 && (
                            <div className="text-center py-2">
                                <button
                                    onClick={() => fetchNextPage()}
                                    className="text-xs text-primary hover:underline"
                                >
                                    Cargar mensajes más antiguos
                                </button>
                            </div>
                        )}
                        {/* Show message when no more messages to load */}
                        {!hasNextPage && !isLoading && messages.length > 0 && (
                            <div className="text-center text-xs text-muted-foreground py-2">
                                • Inicio de la conversación •
                            </div>
                        )}
                        {isLoading && (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                                        <div className="max-w-[70%] space-y-2">
                                            <Skeleton className="h-16 w-64" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {messagesError && <div className="text-center text-sm text-red-500 py-4">Error al cargar mensajes</div>}
                        {!isLoading && messages.length === 0 && <div className="text-center text-sm text-muted-foreground py-4">No hay mensajes aún</div>}
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-2 ${msg.userId === currentUserId ? 'justify-end' : 'justify-start'}`}>
                                {/* {msg.userId !== currentUserId && (
                                    <Avatar className="h-8 w-8 mt-1">
                                        <AvatarImage src={msg.userImage || ''} />
                                        <AvatarFallback>{(msg.userName || '?').substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                )} */}
                                <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${msg.userId === currentUserId ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                    }`}>
                                    {msg.content && <p>{msg.content}</p>}
                                    {msg.files && msg.files.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            {msg.files.map((file: any) => (
                                                <a
                                                    key={file.id}
                                                    href={file.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`flex items-center gap-2 text-xs p-2 rounded border ${msg.userId === currentUserId
                                                        ? 'bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/20'
                                                        : 'bg-background border-border hover:bg-muted'
                                                        }`}
                                                >
                                                    <Paperclip className="w-3 h-3" />
                                                    <span className="truncate flex-1">{file.name}</span>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                    <div className="text-[10px] opacity-70 mt-1 text-right flex items-center justify-end gap-1">
                                        <span>{new Date(msg.createdAt.endsWith('Z') ? msg.createdAt : `${msg.createdAt}Z`).toLocaleTimeString()}</span>
                                        {msg.userId === currentUserId && (
                                            <>
                                                {msg.status === 'pending' && <Clock className="w-3 h-3" />}
                                                {msg.status === 'sent' && <Check className="w-3 h-3" />}
                                                {msg.status === 'delivered' && <CheckCheck className="w-3 h-3" />}
                                            </>
                                        )}
                                    </div>
                                </div>
                                {/* {msg.userId === currentUserId && (
                                    <Avatar className="h-8 w-8 mt-1">
                                        <AvatarImage src={session?.user?.image || ''} />
                                        <AvatarFallback>{(session?.user?.name || '?').substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                )} */}
                            </div>
                        ))}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>
            </CardContent>

            <CardFooter className="p-3 border-t gap-2 flex-col">
                {/* File attachments preview */}
                {(attachedFiles.length > 0 || pendingCloudFiles.length > 0) && (
                    <div className="w-full bg-muted/50 rounded p-2 text-xs">
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">Archivos adjuntos ({attachedFiles.length + pendingCloudFiles.length})</span>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2"
                                onClick={() => {
                                    setAttachedFiles([]);
                                    setPendingCloudFiles([]);
                                }}
                            >
                                Limpiar
                            </Button>
                        </div>
                        <div className="space-y-1">
                            {attachedFiles.map((file, idx) => (
                                <div key={idx} className="text-xs text-muted-foreground truncate">
                                    📎 {file.name}
                                </div>
                            ))}
                            {pendingCloudFiles.map((file) => (
                                <div key={file.id} className="text-xs text-muted-foreground truncate">
                                    ☁️ {file.name}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex w-full gap-2">
                    <Popover open={showAttachments} onOpenChange={setShowAttachments}>
                        <PopoverTrigger asChild>
                            <Button size="icon" variant="ghost">
                                <Paperclip className="w-5 h-5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[500px] p-0" align="start" side="top">
                            <div className="p-4">
                                <ModelAttachmentsCreator
                                    files={attachedFiles}
                                    onFilesChange={setAttachedFiles}
                                    pendingCloudFiles={pendingCloudFiles}
                                    onPendingCloudFilesChange={setPendingCloudFiles}
                                />
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Input
                        className="flex-1"
                        placeholder="Escribe un mensaje..."
                        value={inputText}
                        onChange={handleInputChange}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                        <PopoverTrigger asChild>
                            <Button size="icon" variant="ghost">
                                <Smile className="w-5 h-5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 border-0" align="end">
                            <EmojiPicker onEmojiClick={handleEmojiClick} width={350} height={400} />
                        </PopoverContent>
                    </Popover>
                    <Button onClick={handleSendMessage} disabled={isSending || !currentUserId}>
                        <Send className="w-4 h-4 mr-2" />
                        {isSending ? 'Enviando...' : 'Enviar'}
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}

