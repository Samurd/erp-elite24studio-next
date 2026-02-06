'use client';

import { Paperclip, Reply, Smile, Clock, Check, Download } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getStorageUrl } from '@/lib/storage-client';

interface MessageItemProps {
    message: any;
    isReply?: boolean;
    rootId?: number;
    session: any;
    onReply: (msg: any) => void;
    onReaction: (msgId: number, emoji: string) => void;
    hoveredId: number | null;
    setHoveredId: (id: number | null) => void;
    reactionPickerId: number | null;
    setReactionPickerId: (id: number | null) => void;
    REACTION_EMOJIS: string[];
}

export default function MessageItem({
    message: msg,
    isReply = false,
    rootId,
    session,
    onReply,
    onReaction,
    hoveredId,
    setHoveredId,
    reactionPickerId,
    setReactionPickerId,
    REACTION_EMOJIS
}: MessageItemProps) {
    const isMe = msg.userId === session?.user?.id;
    const isNestedReply = isReply && msg.parentId && rootId && msg.parentId !== rootId;

    const avatarSrc = getStorageUrl(msg.user?.image || msg.userImage);

    return (
        <div
            className={`flex gap-3 group relative ${isReply ? 'mt-2' : ''}`}
            onMouseEnter={() => setHoveredId(msg.id)}
            onMouseLeave={() => { setHoveredId(null); if (reactionPickerId !== msg.id) setReactionPickerId(null); }}
        >
            <div className={`relative ${isReply ? 'h-6 w-6' : 'h-8 w-8'}`}>
                <Avatar className={`${isReply ? 'h-6 w-6' : 'h-8 w-8'} mt-1`}>
                    <AvatarImage src={avatarSrc} />
                    <AvatarFallback>{(msg.user?.name || msg.userName || '?').substring(0, 2)}</AvatarFallback>
                </Avatar>
            </div>

            <div className={`flex flex-col max-w-[90%] items-start`}>
                <div className="flex items-center gap-2 mb-1">
                    <span className={`font-semibold text-gray-900 ${isReply ? 'text-xs' : 'text-sm'}`}>{msg.user?.name || msg.userName} {isMe && <span className="text-xs text-gray-500">(Tu)</span>}</span>
                    <span className="text-xs text-gray-500">
                        {new Date(msg.createdAt.endsWith('Z') ? msg.createdAt : `${msg.createdAt}Z`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                <div className={`px-4 py-2 text-sm shadow-sm relative rounded-md ${isMe
                    ? 'bg-blue-50 border border-blue-100 text-gray-900'
                    : 'bg-gray-50 border border-gray-200 text-gray-900'
                    } ${isReply ? 'px-3 py-1.5' : ''}`}>

                    {/* Nested Reply Quote */}
                    {isNestedReply && msg.parentMessage && (
                        <div className="mb-2 p-1.5 bg-gray-50/50 border-l-2 border-blue-400 rounded text-xs text-gray-600 flex flex-col cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                const el = document.getElementById(`msg-${msg.parentId}`);
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                        >
                            <span className="font-semibold flex items-center gap-1">
                                <Reply className="w-3 h-3" />
                                {msg.parentMessage.userName}
                            </span>
                            <span className="truncate line-clamp-1 opacity-80 italic max-w-[200px]">
                                {msg.parentMessage.content}
                            </span>
                        </div>
                    )}

                    <div
                        className="prose prose-sm max-w-none text-gray-900 [&>p]:mb-1 [&>p:last-child]:mb-0"
                        dangerouslySetInnerHTML={{ __html: msg.content }}
                    />

                    {/* Files */}
                    {/* Files */}
                    {msg.files && msg.files.length > 0 && (
                        <div className="mt-2 space-y-1 w-full max-w-xs">
                            {msg.files.map((f: any, i: number) => (
                                <div key={i} className={`group flex items-center justify-between p-2 rounded border shadow-sm transition-colors ${isMe ? 'bg-blue-600/10 border-blue-600/20' : 'bg-white border-gray-200'}`}>
                                    <div className="flex items-center gap-2 overflow-hidden min-w-0">
                                        <div className={`w-8 h-8 flex items-center justify-center rounded flex-shrink-0 ${isMe ? 'bg-blue-600/20 text-blue-700' : 'bg-blue-50 text-blue-500'}`}>
                                            <Paperclip className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <a
                                                href={f.url || '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`text-xs font-medium truncate block hover:underline ${isMe ? 'text-blue-900' : 'text-gray-700'}`}
                                                title={f.name}
                                            >
                                                {f.name}
                                            </a>
                                            {f.size && <span className={`text-[10px] block ${isMe ? 'text-blue-800/70' : 'text-gray-400'}`}>{Math.round(f.size / 1024)} KB</span>}
                                        </div>
                                    </div>
                                    <a
                                        href={f.url || '#'}
                                        download
                                        className={`p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100 ${isMe ? 'text-blue-800 hover:bg-blue-600/20' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                                        title="Descargar"
                                    >
                                        <Check className="w-3 h-3" />
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}

                    {msg.isOptimistic && (
                        <span className="absolute bottom-1 right-2 opacity-70">
                            <Clock className="w-3 h-3 text-gray-400" />
                        </span>
                    )}
                    <div className={`absolute top-0 right-[-60px] flex items-center opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm rounded-md border border-gray-100 p-1 h-8 z-10`}>
                        <button onClick={() => onReply(msg)} className="p-1 hover:bg-gray-100 rounded text-gray-500" title="Responder">
                            <Reply className="h-4 w-4" />
                        </button>
                        <div className="relative">
                            <button onClick={() => setReactionPickerId(reactionPickerId === msg.id ? null : msg.id)} className="p-1 hover:bg-gray-100 rounded text-gray-500" title="Reaccionar">
                                <Smile className="h-4 w-4" />
                            </button>

                            {reactionPickerId === msg.id && (
                                <div className="absolute bottom-full mb-2 left-[-50px] bg-white shadow-lg rounded-full p-1 flex gap-1 border border-gray-200 z-50">
                                    {REACTION_EMOJIS.map(emoji => (
                                        <button key={emoji} onClick={() => onReaction(msg.id, emoji)} className="hover:scale-125 transition-transform p-1">
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Reactions (Display) */}
                {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {msg.reactions.map((r: any) => (
                            <button
                                key={r.emoji}
                                onClick={() => onReaction(msg.id, r.emoji)}
                                className={`text-xs px-1.5 py-0.5 rounded-full border flex items-center gap-1 hover:bg-gray-50 transition-colors ${r.meReacted ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-600'}`}
                                title={`${r.users?.map((u: any) => u.name).join(', ') || ''}`}
                            >
                                <span>{r.emoji}</span>
                                <span className="font-medium">{r.count}</span>
                            </button>
                        ))}
                    </div>
                )}

            </div>

        </div>
    );
}
