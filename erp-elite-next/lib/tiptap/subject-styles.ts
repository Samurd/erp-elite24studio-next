export const SUBJECT_STYLES = {
    important: {
        type: 'important',
        label: 'Importante',
        icon: '🔴',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-300',
        textColor: 'text-red-900',
    },
    announcement: {
        type: 'announcement',
        label: 'Anuncio',
        icon: '📢',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-300',
        textColor: 'text-blue-900',
    },
    question: {
        type: 'question',
        label: 'Pregunta',
        icon: '❓',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-300',
        textColor: 'text-yellow-900',
    },
    idea: {
        type: 'idea',
        label: 'Idea',
        icon: '💡',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-300',
        textColor: 'text-green-900',
    },
    celebration: {
        type: 'celebration',
        label: 'Celebración',
        icon: '🎉',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-300',
        textColor: 'text-purple-900',
    },
} as const;

export type SubjectStyleType = keyof typeof SUBJECT_STYLES;

export function getSubjectStyle(styleType: SubjectStyleType | string) {
    return SUBJECT_STYLES[styleType as SubjectStyleType] || SUBJECT_STYLES.important;
}
