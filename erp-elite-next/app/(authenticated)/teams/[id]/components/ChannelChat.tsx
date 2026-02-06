'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
import { useSocket } from '@/components/providers/SocketProvider';
import { toast } from 'sonner';
import { uploadFile } from '@/actions/files';
import { ChannelSettingsModal } from './ChannelSettingsModal';
import ChatHeader from './channel-chat/ChatHeader';
import MessageList from './channel-chat/MessageList';

import MessageInput from './channel-chat/MessageInput';
import { ModelAttachmentsRef } from '@/components/cloud/ModelAttachments';

interface ChannelChatProps {
    teamId: number;
    channel: any;
    isOwner: boolean;
}

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

export function ChannelChat({ teamId, channel, isOwner }: ChannelChatProps) {
    const socket = useSocket();
    const { data: session } = authClient.useSession();
    const [content, setContent] = useState('');
    const [messages, setMessages] = useState<any[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    // UI States
    const [isSending, setIsSending] = useState(false);
    const [showAttachments, setShowAttachments] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [fileCount, setFileCount] = useState(0);
    const attachmentsRef = useRef<ModelAttachmentsRef>(null);


    // Typing Indicator
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState<string>('');
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Threads / Replies
    const [replyingTo, setReplyingTo] = useState<any | null>(null);

    // Channel Settings
    const [showSettings, setShowSettings] = useState(false);

    // Reactions
    const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);
    const [showReactionPickerId, setShowReactionPickerId] = useState<number | null>(null);

    // Check connection status
    const isConnected = socket?.connected;

    // Initial Fetch with infinite query for pagination
    const {
        data: messagesData,
        isLoading,
        error: messagesError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInfiniteQuery({
        queryKey: ['channel-messages', channel.id],
        queryFn: async ({ pageParam }: { pageParam: any }) => {
            const url = new URL(`/api/teams/${teamId}/channels/${channel.id}/messages`, window.location.origin);
            if (pageParam) {
                url.searchParams.set('beforeId', pageParam.toString());
            }

            const res = await fetch(url.toString());
            if (!res.ok) {
                const errorText = await res.text();
                console.error('❌ Failed to fetch channel messages:', errorText);
                throw new Error('Failed to fetch messages');
            }
            const data = await res.json();
            return data;
        },
        getNextPageParam: (lastPage) => {
            return lastPage.hasMore ? lastPage.nextCursor : undefined;
        },
        initialPageParam: undefined,
        enabled: !!channel.id,
    });

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

    // Populate messages on initial load only
    useEffect(() => {
        if (allMessages.length > 0 && messages.length === 0) {
            setMessages(allMessages);
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allMessages.length]);

    // Clear messages when channel changes
    useEffect(() => {
        setMessages([]);
        // Reset the infinite query when channel changes
        queryClient.resetQueries({ queryKey: ['channel-messages', channel.id] });
    }, [channel.id, queryClient]);

    // Socket Connection & Events
    useEffect(() => {
        if (!socket || !channel.id) return;

        const roomId = `channel:${channel.id}`;

        // Join Room
        socket.emit('joinRoom', { room: roomId });

        // Listen for messages
        const handleNewMessage = (msg: any) => {
            setMessages(prev => {
                if (!Array.isArray(prev)) return [msg];
                if (prev.find(m => String(m.id) === String(msg.id))) return prev;
                return [...prev, msg];
            });

            // Sync with Cache - Update the infinite query data
            queryClient.setQueryData(['channel-messages', channel.id], (oldData: any) => {
                if (!oldData || !oldData.pages || !Array.isArray(oldData.pages) || oldData.pages.length === 0) return oldData;

                const lastPage = oldData.pages[oldData.pages.length - 1];
                if (!lastPage || !Array.isArray(lastPage.messages)) return oldData;
                if (lastPage.messages.find((m: any) => m.id === msg.id)) return oldData;

                return {
                    ...oldData,
                    pages: oldData.pages.map((page: any, idx: number) =>
                        idx === oldData.pages.length - 1
                            ? { ...page, messages: [...page.messages, msg] }
                            : page
                    )
                };
            });

            if (bottomRef.current) {
                bottomRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        };

        const handleTyping = (data: { isTyping: boolean, userName: string }) => {
            setIsTyping(data.isTyping);
            setTypingUser(data.userName);
        };

        const handleReactionUpdated = (data: { messageId: number, reactions: any[] }) => {
            // console.log('🔔 socket:reactionUpdated received', data);

            const updateMessage = (m: any) => {
                if (String(m.id) === String(data.messageId)) {
                    const updatedReactions = data.reactions.map(r => ({
                        ...r,
                        // Flexible ID comparison
                        meReacted: r.userIds?.some((uid: any) => String(uid) === String(session?.user?.id)) || false,
                        // Ensure users array exists for tooltip
                        users: r.users || [],
                        // Ensure count is correct
                        count: r.userIds?.length || r.users?.length || r.count || 0
                    }));
                    // console.log(`✅ Updating message ${m.id} reactions:`, updatedReactions);
                    return { ...m, reactions: updatedReactions };
                }
                return m;
            };

            setMessages(prev => {
                if (!Array.isArray(prev)) return prev;
                const updated = prev.map(updateMessage);
                // console.log('📝 Messages state updated, count:', updated.length);
                return updated;
            });

            // Update the infinite query cache structure
            queryClient.setQueryData(['channel-messages', channel.id], (oldData: any) => {
                if (!oldData || !oldData.pages || !Array.isArray(oldData.pages)) return oldData;

                return {
                    ...oldData,
                    pages: oldData.pages.map((page: any) => ({
                        ...page,
                        messages: Array.isArray(page.messages) ? page.messages.map(updateMessage) : page.messages
                    }))
                };
            });
        };

        socket.on('newMessage', handleNewMessage);
        socket.on('typing', handleTyping);
        socket.on('reactionUpdated', handleReactionUpdated);

        return () => {
            socket.emit('leaveRoom', { room: roomId });
            socket.off('newMessage', handleNewMessage);
            socket.off('typing', handleTyping);
            socket.off('reactionUpdated', handleReactionUpdated);
        };
    }, [socket, channel.id, session?.user?.id]);

    const groupedMessages = useMemo(() => {
        // Deduplicate messages first to ensure uniqueness
        const uniqueMessages = Array.from(new Map(messages.map(m => [m.id, m])).values());

        const idToMessage = new Map<number, any>();
        uniqueMessages.forEach(m => idToMessage.set(m.id, m));

        const roots: any[] = [];
        const repliesByRoot: Record<number, any[]> = {};

        const findRoot = (msg: any): any => {
            if (!msg.parentId) return msg;
            let current = msg;
            const seen = new Set<number>();
            while (current.parentId) {
                if (seen.has(current.id)) break; // Cycle protection
                seen.add(current.id);
                const parent = idToMessage.get(current.parentId);
                if (!parent) return null; // Orphaned (or parent not loaded)
                current = parent;
            }
            return current;
        };

        uniqueMessages.forEach(m => {
            if (!m.parentId) {
                roots.push(m);
            } else {
                const root = findRoot(m);
                if (root) {
                    if (!repliesByRoot[root.id]) repliesByRoot[root.id] = [];
                    repliesByRoot[root.id].push(m);
                } else {
                    roots.push(m);
                }
            }
        });

        //Sort replies by date
        Object.keys(repliesByRoot).forEach(key => {
            repliesByRoot[parseInt(key)].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        });

        // Sort roots by date
        roots.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        return { roots, repliesByRoot };
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        // Strip HTML tags to check if empty (basic check)
        const strippedContent = content.replace(/<[^>]*>/g, '').trim();
        if ((!strippedContent && fileCount === 0) || !socket || !session?.user || isSending) return;

        setIsSending(true);

        const tempId = Date.now();

        try {
            // 1. Upload files via ModelAttachments
            const allFileIds = await attachmentsRef.current?.upload() || [];

            // Use immediate parent ID for recursive threading structure
            const finalParentId = replyingTo?.id;

            const optimisticMsg = {
                id: tempId,
                content,
                userId: session.user.id,
                userName: session.user.name,
                userEmail: session.user.email,
                userImage: session.user.image,
                createdAt: new Date().toISOString(),
                isOptimistic: true,

                files: allFileIds.map(id => ({ id, name: 'Archivo adjunto' })), // Simplified optimistic update
                parentId: finalParentId,
                parentMessage: replyingTo ? {
                    id: replyingTo.id,
                    content: replyingTo.content,
                    userName: replyingTo.user?.name || replyingTo.userName,
                    userId: replyingTo.userId
                } : null,
                user: {
                    name: session.user.name,
                    image: session.user.image
                }
            };

            // UI Update
            setMessages(prev => Array.isArray(prev) ? [...prev, optimisticMsg] : [optimisticMsg]);
            setContent('');
            setShowAttachments(false);
            attachmentsRef.current?.clear();
            setReplyingTo(null);

            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

            // Emit to Socket
            socket.emit('sendMessage', {
                content: optimisticMsg.content,
                roomId: `channel:${channel.id}`,
                userId: session.user.id,
                fileIds: allFileIds.length > 0 ? allFileIds : undefined,
                parentId: optimisticMsg.parentId
            }, (response: any) => {
                if (response?.status === 'ok') {
                    const finalMsg = { ...response.message, user: { name: response.message.userName, image: session.user?.image } };

                    setMessages(prev => {
                        if (!Array.isArray(prev)) return prev;
                        return prev.map(m => m.id === tempId ? finalMsg : m);
                    });

                    // Sync with Cache - Update the infinite query data
                    queryClient.setQueryData(['channel-messages', channel.id], (oldData: any) => {
                        if (!oldData || !oldData.pages || !Array.isArray(oldData.pages) || oldData.pages.length === 0) return oldData;

                        return {
                            ...oldData,
                            pages: oldData.pages.map((page: any, idx: number) => {
                                if (idx === oldData.pages.length - 1) {
                                    return { ...page, messages: Array.isArray(page.messages) ? [...page.messages, finalMsg] : [finalMsg] };
                                }
                                return page;
                            })
                        };
                    });
                } else {
                    toast.error('Error al enviar mensaje');
                    setMessages(prev => Array.isArray(prev) ? prev.filter(m => m.id !== tempId) : prev);
                }
            });
        } catch (error) {
            console.error(error);
            toast.error('Error de conexión');
            setMessages(prev => Array.isArray(prev) ? prev.filter(m => m.id !== tempId || m.isOptimistic) : prev);
        } finally {
            setIsSending(false);
        }
    };

    const handleEditorChange = (html: string) => {
        setContent(html);
        if (!socket) return;

        socket.emit('typing', {
            room: `channel:${channel.id}`,
            isTyping: true,
            userName: session?.user?.name
        });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing', {
                room: `channel:${channel.id}`,
                isTyping: false,
                userName: session?.user?.name
            });
        }, 2000);
    };

    const toggleReaction = async (msgId: number, emoji: string) => {
        if (!socket) return;

        // Optimistic update
        setMessages(prev => {
            if (!Array.isArray(prev)) return prev;
            return prev.map(m => {
                if (m.id === msgId) {
                    // Find existing reaction
                    const existingGroup = m.reactions?.find((r: any) => r.emoji === emoji);
                    const meReacted = existingGroup?.meReacted;

                    // If meReacted -> remove, else add
                    let newReactions = m.reactions || [];

                    if (existingGroup) {
                        if (meReacted) {
                            // Decrement count, remove meReacted
                            newReactions = newReactions.map((r: any) =>
                                r.emoji === emoji
                                    ? { ...r, count: r.count - 1, meReacted: false, users: r.users.filter((u: any) => u.name !== session?.user?.name) }
                                    : r
                            ).filter((r: any) => r.count > 0);
                        } else {
                            // Increment count, set meReacted
                            newReactions = newReactions.map((r: any) =>
                                r.emoji === emoji
                                    ? { ...r, count: r.count + 1, meReacted: true, users: [...r.users, { name: session?.user?.name }] }
                                    : r
                            );
                        }
                    } else {
                        // Create new group
                        newReactions = [...newReactions, { emoji, count: 1, meReacted: true, users: [{ name: session?.user?.name }] }];
                    }

                    return { ...m, reactions: newReactions };
                }
                return m;
            });
        });

        const msg = messages.find(m => m.id === msgId);
        const group = msg?.reactions?.find((r: any) => r.emoji === emoji);
        const action = group?.meReacted ? 'remove' : 'add';

        socket.emit('messageReaction', {
            roomId: `channel:${channel.id}`,
            messageId: msgId,
            userId: session?.user?.id,
            emoji,
            action
        });

        setShowReactionPickerId(null);
    };

    if (isLoading) return (
        <div className="flex-1 flex flex-col h-full bg-white">
            <ChatHeader
                channel={channel}
                isTyping={false}
                typingUser=""
                isConnected={!!isConnected}
                onOpenSettings={() => { }}
            />
            <MessageList // Pass loading state to MessageList to render Skeletons
                messages={[]}
                groupedMessages={{ roots: [], repliesByRoot: {} }}
                isLoading={true}
                hasNextPage={false}
                isFetchingNextPage={false}
                fetchNextPage={async () => { }}
                messagesError={null}
                session={session}
                onReply={() => { }}
                onReaction={() => { }}
                hoveredId={null}
                setHoveredId={() => { }}
                reactionPickerId={null}
                setReactionPickerId={() => { }}
                REACTION_EMOJIS={REACTION_EMOJIS}
                bottomRef={bottomRef as React.RefObject<HTMLDivElement>}
                scrollContainerRef={scrollContainerRef as React.RefObject<HTMLDivElement>}
            />
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-white">
            <ChatHeader
                channel={channel}
                isTyping={isTyping}
                typingUser={typingUser}
                isConnected={!!isConnected}
                onOpenSettings={() => setShowSettings(true)}
            />

            <MessageList
                messages={messages}
                groupedMessages={groupedMessages}
                isLoading={isLoading}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                fetchNextPage={fetchNextPage}
                messagesError={messagesError}
                session={session}
                onReply={setReplyingTo}
                onReaction={toggleReaction}
                hoveredId={hoveredMessageId}
                setHoveredId={setHoveredMessageId}
                reactionPickerId={showReactionPickerId}
                setReactionPickerId={setShowReactionPickerId}
                REACTION_EMOJIS={REACTION_EMOJIS}
                bottomRef={bottomRef as React.RefObject<HTMLDivElement>}
                scrollContainerRef={scrollContainerRef as React.RefObject<HTMLDivElement>}
            />

            <MessageInput
                content={content}
                setContent={setContent}
                handleSend={handleSend}
                handleEditorChange={handleEditorChange}
                isSending={isSending}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                channelName={channel.name}
                showAttachments={showAttachments}
                setShowAttachments={setShowAttachments}
                showEmojiPicker={showEmojiPicker}
                setShowEmojiPicker={setShowEmojiPicker}
                attachmentsRef={attachmentsRef}
                onFileCountChange={setFileCount}
                fileCount={fileCount}
            />

            <ChannelSettingsModal
                open={showSettings}
                onOpenChange={setShowSettings}
                channel={channel}
                teamId={teamId}
                isOwner={isOwner}
            />
        </div>
    );
}
