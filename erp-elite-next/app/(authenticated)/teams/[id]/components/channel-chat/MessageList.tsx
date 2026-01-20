'use client';

import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import MessageItem from './MessageItem';

interface MessageListProps {
    messages: any[];
    groupedMessages: { roots: any[]; repliesByRoot: Record<number, any[]> };
    isLoading: boolean;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => Promise<any>;
    messagesError: any;
    session: any;
    onReply: (msg: any) => void;
    onReaction: (msgId: number, emoji: string) => void;
    hoveredId: number | null;
    setHoveredId: (id: number | null) => void;
    reactionPickerId: number | null;
    setReactionPickerId: (id: number | null) => void;
    REACTION_EMOJIS: string[];
    bottomRef: React.RefObject<HTMLDivElement>;
    scrollContainerRef: React.RefObject<HTMLDivElement>;
}

export default function MessageList({
    messages,
    groupedMessages,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    messagesError,
    session,
    onReply,
    onReaction,
    hoveredId,
    setHoveredId,
    reactionPickerId,
    setReactionPickerId,
    REACTION_EMOJIS,
    bottomRef,
    scrollContainerRef
}: MessageListProps) {

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
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, scrollContainerRef]);

    if (isLoading) return (
        <div className="flex-1 p-6 space-y-6">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-16 w-full max-w-md" />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <ScrollArea className="flex-1 p-6 min-h-0" ref={scrollContainerRef}>
            <div className="space-y-6">
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
                        • Inicio del canal •
                    </div>
                )}

                {messagesError && <div className="text-center text-sm text-red-500 py-4">Error al cargar mensajes</div>}
                {!isLoading && messages.length === 0 && <div className="text-center text-sm text-muted-foreground py-4">No hay mensajes aún</div>}

                {groupedMessages.roots.map((msg: any) => {
                    const replies = groupedMessages.repliesByRoot[msg.id];
                    return (
                        <div key={msg.id} className="flex flex-col">
                            {/* Root Message */}
                            <MessageItem
                                message={msg}
                                isReply={false}
                                rootId={msg.id}
                                session={session}
                                onReply={onReply}
                                onReaction={onReaction}
                                hoveredId={hoveredId}
                                setHoveredId={setHoveredId}
                                reactionPickerId={reactionPickerId}
                                setReactionPickerId={setReactionPickerId}
                                REACTION_EMOJIS={REACTION_EMOJIS}
                            />
                            <div id={`msg-${msg.id}`} />

                            {replies && replies.length > 0 && (
                                <div className="ml-10 mt-2 pl-4 border-l-2 border-gray-100 flex flex-col gap-3">
                                    {replies.map((reply: any) => {
                                        return (
                                            <div key={reply.id}>
                                                <div id={`msg-${reply.id}`} className="scroll-mt-4" />
                                                <MessageItem
                                                    message={reply}
                                                    isReply={true}
                                                    rootId={msg.id}
                                                    session={session}
                                                    onReply={onReply}
                                                    onReaction={onReaction}
                                                    hoveredId={hoveredId}
                                                    setHoveredId={setHoveredId}
                                                    reactionPickerId={reactionPickerId}
                                                    setReactionPickerId={setReactionPickerId}
                                                    REACTION_EMOJIS={REACTION_EMOJIS}
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>
        </ScrollArea>
    );
}
