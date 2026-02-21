import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { TextStyleKit } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
    Bold,
    Code,
    Heading1,
    Heading2,
    Heading3,
    Highlighter,
    Italic,
    Link2,
    List,
    ListOrdered,
    ListTodo,
    Quote,
    Redo,
    Strikethrough,
    Underline as UnderlineIcon,
    Undo,
} from 'lucide-react';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    className?: string;
    editable?: boolean;
}

export function RichTextEditor({
    content,
    onChange,
    placeholder = 'Start writing...',
    className,
    editable = true,
}: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            TextStyleKit,
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Underline,
            Highlight,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline cursor-pointer',
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
        ],
        content,
        editable,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none dark:prose-invert focus:outline-none min-h-[200px] p-4',
            },
        },
    });

    // Update content when it changes externally
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    if (!editor) {
        return null;
    }

    if (!editable) {
        return (
            <div
                className={cn(
                    'prose prose-sm max-w-none p-4 rounded-md bg-muted/50',
                    className,
                )}
            >
                <EditorContent editor={editor} />
            </div>
        );
    }

    return (
        <div className={cn('border rounded-md', className)}>
            {/* Toolbar */}
            <div className="border-b bg-muted/50 p-2 flex flex-wrap gap-1">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={editor.isActive('bold') ? 'bg-muted' : ''}
                    title="Bold"
                >
                    <Bold className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={editor.isActive('italic') ? 'bg-muted' : ''}
                    title="Italic"
                >
                    <Italic className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                        editor.chain().focus().toggleUnderline().run()
                    }
                    className={editor.isActive('underline') ? 'bg-muted' : ''}
                    title="Underline"
                >
                    <UnderlineIcon className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={editor.isActive('strike') ? 'bg-muted' : ''}
                    title="Strikethrough"
                >
                    <Strikethrough className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                        editor.chain().focus().toggleHighlight().run()
                    }
                    className={editor.isActive('highlight') ? 'bg-muted' : ''}
                    title="Highlight"
                >
                    <Highlighter className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1" />

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 1 }).run()
                    }
                    className={
                        editor.isActive('heading', { level: 1 })
                            ? 'bg-muted'
                            : ''
                    }
                    title="Heading 1"
                >
                    <Heading1 className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                    className={
                        editor.isActive('heading', { level: 2 })
                            ? 'bg-muted'
                            : ''
                    }
                    title="Heading 2"
                >
                    <Heading2 className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 3 }).run()
                    }
                    className={
                        editor.isActive('heading', { level: 3 })
                            ? 'bg-muted'
                            : ''
                    }
                    title="Heading 3"
                >
                    <Heading3 className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1" />

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                        editor.chain().focus().toggleBulletList().run()
                    }
                    className={editor.isActive('bulletList') ? 'bg-muted' : ''}
                    title="Bullet List"
                >
                    <List className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                        editor.chain().focus().toggleOrderedList().run()
                    }
                    className={editor.isActive('orderedList') ? 'bg-muted' : ''}
                    title="Numbered List"
                >
                    <ListOrdered className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                        editor.chain().focus().toggleTaskList().run()
                    }
                    className={editor.isActive('taskList') ? 'bg-muted' : ''}
                    title="Task List"
                >
                    <ListTodo className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1" />

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                        editor.chain().focus().toggleBlockquote().run()
                    }
                    className={editor.isActive('blockquote') ? 'bg-muted' : ''}
                    title="Quote"
                >
                    <Quote className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    className={editor.isActive('code') ? 'bg-muted' : ''}
                    title="Inline Code"
                >
                    <Code className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        const url = window.prompt('Enter URL:');
                        if (url) {
                            editor.chain().focus().setLink({ href: url }).run();
                        }
                    }}
                    className={editor.isActive('link') ? 'bg-muted' : ''}
                    title="Add Link"
                >
                    <Link2 className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1" />

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    title="Undo"
                >
                    <Undo className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    title="Redo"
                >
                    <Redo className="h-4 w-4" />
                </Button>
            </div>

            {/* Editor Content */}
            <EditorContent editor={editor} />
        </div>
    );
}
