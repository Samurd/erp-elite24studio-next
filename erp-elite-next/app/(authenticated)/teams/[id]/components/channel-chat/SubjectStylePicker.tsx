'use client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SUBJECT_STYLES, SubjectStyleType } from '@/lib/tiptap/subject-styles';
import { Editor } from '@tiptap/react';
import { Heading, X } from 'lucide-react';

interface SubjectStylePickerProps {
    editor: Editor | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function SubjectStylePicker({ editor, open, onOpenChange }: SubjectStylePickerProps) {
    if (!editor) return null;

    const handleSelectStyle = (styleType: SubjectStyleType) => {
        editor.commands.setMessageSubject({ style: styleType });
        editor.commands.focus();
        onOpenChange(false);
    };

    const handleRemoveSubject = () => {
        editor.commands.removeMessageSubject();
        editor.commands.focus();
        onOpenChange(false);
    };

    // Check if there's already a subject
    let hasSubject = false;
    editor.state.doc.descendants((node) => {
        if (node.type.name === 'messageSubject') {
            hasSubject = true;
            return false;
        }
    });

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700"
                    title="Agregar título al mensaje"
                >
                    <Heading className="w-4 h-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3" align="start">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">Estilo de Título</h3>
                        {hasSubject && (
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={handleRemoveSubject}
                                className="h-6 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                <X className="w-3 h-3 mr-1" />
                                Remover
                            </Button>
                        )}
                    </div>

                    <div className="space-y-2">
                        {Object.entries(SUBJECT_STYLES).map(([key, style]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => handleSelectStyle(key as SubjectStyleType)}
                                className={`w-full text-left p-2 rounded-lg border-2 transition-all hover:shadow-md ${style.bgColor} ${style.borderColor}`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{style.icon}</span>
                                    <div className="flex-1">
                                        <div className={`font-bold text-sm ${style.textColor}`}>
                                            {style.label}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {key === 'important' && 'Para mensajes urgentes'}
                                            {key === 'announcement' && 'Para anuncios importantes'}
                                            {key === 'question' && 'Para preguntas al equipo'}
                                            {key === 'idea' && 'Para compartir ideas'}
                                            {key === 'celebration' && 'Para celebrar logros'}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
