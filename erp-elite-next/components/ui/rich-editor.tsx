'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { MessageSubject } from '@/lib/tiptap/extensions/MessageSubject';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Strikethrough, Code, List, ListOrdered, Heading1, Heading2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import SubjectStylePicker from '@/app/(authenticated)/teams/[id]/components/channel-chat/SubjectStylePicker';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    disabled?: boolean;
    onSubmit?: () => void;
    className?: string;
    showSubjectButton?: boolean;
}

export function RichTextEditor({ value, onChange, placeholder, disabled, onSubmit, className, showSubjectButton = false }: RichTextEditorProps) {
    const [showSubjectPicker, setShowSubjectPicker] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit,
            MessageSubject,
            Placeholder.configure({
                placeholder: placeholder || 'Escribe un mensaje... (Ctrl+Enter para enviar)',
            }),
        ],
        content: value,
        editable: !disabled,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[40px] px-3 py-2 text-sm',
            },
            handleKeyDown: (view, event) => {
                if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && onSubmit) {
                    event.preventDefault();
                    onSubmit();
                    return true;
                }
                return false;
            }
        },
    });

    // Sync external value changes (e.g. clear after send)
    useEffect(() => {
        if (editor && value === '') {
            editor.commands.clearContent();
        }
    }, [value, editor]);

    if (!editor) return null;

    return (
        <div className={cn("border border-gray-300 rounded-md bg-white focus-within:ring-2 focus-within:ring-yellow-500 focus-within:border-transparent transition-all", className)}>
            <div className="flex items-center gap-1 p-1 border-b border-gray-100 overflow-x-auto">
                {showSubjectButton && (
                    <>
                        <SubjectStylePicker
                            editor={editor}
                            open={showSubjectPicker}
                            onOpenChange={setShowSubjectPicker}
                        />
                        <div className="w-px h-4 bg-gray-200 mx-1" />
                    </>
                )}
                <ToolbarButton
                    active={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    icon={<Bold className="w-4 h-4" />}
                />
                <ToolbarButton
                    active={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    icon={<Italic className="w-4 h-4" />}
                />
                <ToolbarButton
                    active={editor.isActive('strike')}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    icon={<Strikethrough className="w-4 h-4" />}
                />
                <div className="w-px h-4 bg-gray-200 mx-1" />
                <ToolbarButton
                    active={editor.isActive('heading', { level: 1 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    icon={<Heading1 className="w-4 h-4" />}
                />
                <ToolbarButton
                    active={editor.isActive('heading', { level: 2 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    icon={<Heading2 className="w-4 h-4" />}
                />
                <div className="w-px h-4 bg-gray-200 mx-1" />
                <ToolbarButton
                    active={editor.isActive('bulletList')}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    icon={<List className="w-4 h-4" />}
                />
                <ToolbarButton
                    active={editor.isActive('orderedList')}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    icon={<ListOrdered className="w-4 h-4" />}
                />
                <ToolbarButton
                    active={editor.isActive('codeBlock')}
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    icon={<Code className="w-4 h-4" />}
                />
            </div>

            <div className="max-h-[200px] overflow-y-auto">
                <EditorContent editor={editor} />
            </div>

            <style jsx global>{`
                .ProseMirror p.is-editor-empty:first-child::before {
                    color: #9ca3af;
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }
            `}</style>
        </div>
    );
}

function ToolbarButton({ active, onClick, icon }: { active?: boolean, onClick: () => void, icon: React.ReactNode }) {
    return (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClick}
            className={cn("h-7 w-7 p-0", active ? "bg-gray-200 text-gray-900" : "text-gray-500 hover:text-gray-700")}
        >
            {icon}
        </Button>
    )
}
