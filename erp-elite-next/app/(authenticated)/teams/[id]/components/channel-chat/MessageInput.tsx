'use client';

import { Paperclip, Smile, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import ModelAttachmentsCreator from '@/components/cloud/ModelAttachmentsCreator';
import { RichTextEditor } from '@/components/ui/rich-editor';

interface MessageInputProps {
    content: string;
    setContent: (content: string) => void;
    handleSend: (e?: React.FormEvent) => void;
    handleEditorChange: (html: string) => void;
    isSending: boolean;
    attachedFiles: File[];
    setAttachedFiles: React.Dispatch<React.SetStateAction<File[]>>;
    pendingCloudFiles: any[];
    setPendingCloudFiles: React.Dispatch<React.SetStateAction<any[]>>;
    replyingTo: any | null;
    setReplyingTo: (msg: any | null) => void;
    channelName: string;
    showAttachments: boolean;
    setShowAttachments: (show: boolean) => void;
    showEmojiPicker: boolean;
    setShowEmojiPicker: (show: boolean) => void;
}

export default function MessageInput({
    content,
    setContent,
    handleSend,
    handleEditorChange,
    isSending,
    attachedFiles,
    setAttachedFiles,
    pendingCloudFiles,
    setPendingCloudFiles,
    replyingTo,
    setReplyingTo,
    channelName,
    showAttachments,
    setShowAttachments,
    showEmojiPicker,
    setShowEmojiPicker
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
            {(attachedFiles.length > 0 || pendingCloudFiles.length > 0) && (
                <div className="bg-white border border-gray-200 p-2 mb-2 rounded flex flex-wrap gap-2 text-xs">
                    {attachedFiles.map((f, i) => (
                        <div key={i} className="bg-gray-100 px-2 py-1 rounded flex items-center gap-2">
                            {f.name} <X className="h-3 w-3 cursor-pointer" onClick={() => setAttachedFiles(p => p.filter((_, idx) => idx !== i))} />
                        </div>
                    ))}
                    {pendingCloudFiles.map((f, i) => (
                        <div key={f.id} className="bg-blue-50 px-2 py-1 rounded flex items-center gap-2 text-blue-700">
                            {f.name} <X className="h-3 w-3 cursor-pointer" onClick={() => setPendingCloudFiles(p => p.filter(x => x.id !== f.id))} />
                        </div>
                    ))}
                </div>
            )}


            <form onSubmit={handleSend} className="flex gap-2 items-end">
                <Popover open={showAttachments} onOpenChange={setShowAttachments}>
                    <PopoverTrigger asChild>
                        <Button type="button" size="icon" variant="ghost" className="text-gray-500 hover:bg-gray-200">
                            <Paperclip className="h-5 w-5" />
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

                <Button type="submit" disabled={isSending || (!content.trim() && attachedFiles.length === 0 && pendingCloudFiles.length === 0)} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
    );
}
