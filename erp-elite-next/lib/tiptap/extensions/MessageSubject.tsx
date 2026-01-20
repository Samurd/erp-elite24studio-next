import { Node, mergeAttributes } from '@tiptap/core';
import { SUBJECT_STYLES, SubjectStyleType } from '../subject-styles';

export interface MessageSubjectOptions {
    HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        messageSubject: {
            /**
             * Set a message subject with a specific style
             */
            setMessageSubject: (attributes: { style: SubjectStyleType }) => ReturnType;
            /**
             * Remove the message subject
             */
            removeMessageSubject: () => ReturnType;
        };
    }
}

export const MessageSubject = Node.create<MessageSubjectOptions>({
    name: 'messageSubject',

    group: 'block',

    content: 'inline*',

    defining: true,

    addOptions() {
        return {
            HTMLAttributes: {},
        };
    },

    addAttributes() {
        return {
            style: {
                default: 'important',
                parseHTML: element => element.getAttribute('data-style') || 'important',
                renderHTML: attributes => {
                    return {
                        'data-style': attributes.style,
                    };
                },
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="message-subject"]',
            },
        ];
    },

    renderHTML({ node, HTMLAttributes }) {
        const styleType = node.attrs.style as SubjectStyleType;
        const style = SUBJECT_STYLES[styleType] || SUBJECT_STYLES.important;

        return [
            'div',
            mergeAttributes(
                this.options.HTMLAttributes,
                HTMLAttributes,
                {
                    'data-type': 'message-subject',
                    'data-style': node.attrs.style,
                    class: `flex items-center gap-2 p-3 rounded-lg mb-3 border-2 ${style.bgColor} ${style.borderColor}`,
                }
            ),
            [
                'span',
                { class: 'text-xl select-none' },
                style.icon,
            ],
            [
                'span',
                { class: `font-bold text-base ${style.textColor}` },
                0, // Content goes here
            ],
        ];
    },

    addCommands() {
        return {
            setMessageSubject:
                (attributes) =>
                    ({ commands, state, chain }) => {
                        // Check if there's already a message subject
                        const { $from } = state.selection;
                        let hasSubject = false;

                        state.doc.descendants((node, pos) => {
                            if (node.type.name === 'messageSubject') {
                                hasSubject = true;
                                return false;
                            }
                        });

                        if (hasSubject) {
                            // Update existing subject style
                            return chain()
                                .command(({ tr, state }) => {
                                    state.doc.descendants((node, pos) => {
                                        if (node.type.name === 'messageSubject') {
                                            tr.setNodeMarkup(pos, undefined, {
                                                ...node.attrs,
                                                style: attributes.style,
                                            });
                                        }
                                    });
                                    return true;
                                })
                                .run();
                        } else {
                            // Insert new message subject at the beginning
                            return chain()
                                .insertContentAt(0, {
                                    type: this.name,
                                    attrs: attributes,
                                    content: [{ type: 'text', text: 'Nuevo título' }],
                                })
                                .focus()
                                .run();
                        }
                    },

            removeMessageSubject:
                () =>
                    ({ tr, state, dispatch }) => {
                        let found = false;

                        state.doc.descendants((node, pos) => {
                            if (node.type.name === 'messageSubject') {
                                if (dispatch) {
                                    tr.delete(pos, pos + node.nodeSize);
                                }
                                found = true;
                                return false;
                            }
                        });

                        return found;
                    },
        };
    },
});
