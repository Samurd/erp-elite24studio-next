'use client';

import { Paperclip, Smile, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import ModelAttachments, { ModelAttachmentsRef } from '@/components/cloud/ModelAttachments';
import { RichTextEditor } from '@/components/ui/rich-editor';

interface MessageInputProps {
    content: string;
    setContent: (content: string) => void;
    handleSend: (e?: React.FormEvent) => void;
    handleEditorChange: (html: string) => void;
    isSending: boolean;
    replyingTo: any | null;
    setReplyingTo: (msg: any | null) => void;
    channelName: string;
    showAttachments: boolean;
    setShowAttachments: (show: boolean) => void;
    showEmojiPicker: boolean;
    setShowEmojiPicker: (show: boolean) => void;
    attachmentsRef: React.RefObject<ModelAttachmentsRef | null>;
    onFileCountChange: (count: number) => void;
    fileCount: number;
}

export default function MessageInput({
    content,
    setContent,
    handleSend,
    handleEditorChange,
    isSending,
    replyingTo,
    setReplyingTo,
    channelName,
    showAttachments,
    setShowAttachments,
    showEmojiPicker,
    setShowEmojiPicker,
    attachmentsRef,
    onFileCountChange,
    fileCount
}: MessageInputProps) {
    return (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
            {/* Reply Context */}
            {replyingTo && (
                <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-t-lg px-4 py-2 border-b-0 -mb-1 text-xs mx-1">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-yellow-800">Respondiendo en hilo de {replyingTo.userName}:</span>
                        <span className="text-yellow-700 truncate max-w-xs">{replyingTo.content}</span>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="text-yellow-600 hover:text-yellow-800">
                        <X className="h-3 w-3" />
                    </button>
                </div>
            )}

            {/* File Previews */}
            {/* File Previews removed, handled by ModelAttachments in Popover */}


            {/* Persistent Attachment Area */}
            <div className="mb-2 border rounded-lg overflow-hidden bg-white shadow-sm transition-all duration-200" style={{ display: showAttachments ? 'block' : 'none' }}>
                <div className="max-h-[160px] overflow-y-auto custom-scrollbar">
                    <ModelAttachments
                        ref={attachmentsRef}
                        modelType="App\Models\Message"
                        areaSlug="teams"
                        onSelectionChange={onFileCountChange}
                        compact={true}
                    />
                </div>
            </div>

            <form onSubmit={handleSend} className="flex gap-2 items-end">
                <Button
                    type="button"
                    size="icon"
                    variant={showAttachments || fileCount > 0 ? "secondary" : "ghost"}
                    className="text-gray-500 hover:bg-gray-200 relative shrink-0"
                    onClick={() => setShowAttachments(!showAttachments)}
                    title="Adjuntar archivos"
                >
                    <Paperclip className="h-5 w-5" />
                    {fileCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                            {fileCount}
                        </span>
                    )}
                </Button>

                <div className="flex-1 relative">
                    <RichTextEditor
                        value={content}
                        onChange={handleEditorChange}
                        placeholder={replyingTo ? `Responder a ${replyingTo.userName}...` : `Enviar mensaje a #${channelName}...`}
                        onSubmit={() => handleSend()}
                        showSubjectButton={true}
                        className="w-full bg-white border-gray-300 focus-within:ring-yellow-500 focus-within:border-yellow-500 min-h-[40px]"
                    />
                    <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                        <PopoverTrigger asChild>
                            <Button type="button" size="icon" variant="ghost" className="absolute right-1 top-2 text-gray-400 hover:text-yellow-500 h-8 w-8 z-10">
                                <Smile className="h-5 w-5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 border-none shadow-none bg-transparent" align="end" side="top">
                            <EmojiPicker
                                onEmojiClick={(emojiData: EmojiClickData) => {
                                    setContent(content + emojiData.emoji);
                                    setShowEmojiPicker(false);
                                }}
                            />
                        </PopoverContent>
                    </Popover>
                    <div className="text-[10px] text-gray-400 mt-1 text-right pr-1">
                        Presiona <strong>Enter</strong> para enviar, <strong>Shift + Enter</strong> para nueva línea
                    </div>
                </div>

                <Button type="submit" disabled={isSending || (!content.trim() && fileCount === 0)} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div >
    );
}
