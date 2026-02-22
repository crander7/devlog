import DOMPurify from 'dompurify';
import { Edit2, Pin, Plus, Search, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useDebounce } from '@/hooks/use-debounce';
import { api } from '@/lib/api';
import type { AppData, Note } from '@/shared/rpc-types';

interface NoteFormData {
    title: string;
    content: string;
    tags: string[];
}

export function Notes() {
    const [data, setData] = useState<AppData | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [viewingNote, setViewingNote] = useState<Note | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [formData, setFormData] = useState<NoteFormData>({
        title: '',
        content: '',
        tags: [],
    });

    const loadData = useCallback(async () => {
        try {
            const appData = await api.getAppData();
            setData(appData);
        } catch (error) {
            console.error('Failed to load notes:', error);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const resetForm = () => {
        setFormData({
            title: '',
            content: '',
            tags: [],
        });
        setEditingNote(null);
    };

    const openCreateDialog = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    const openEditDialog = (note: Note) => {
        setFormData({
            title: note.title,
            content: note.content,
            tags: [...note.tags],
        });
        setEditingNote(note);
        setIsViewDialogOpen(false);
        setIsDialogOpen(true);
    };

    const openViewDialog = (note: Note) => {
        setViewingNote(note);
        setIsViewDialogOpen(true);
    };

    const closeViewDialog = () => {
        setIsViewDialogOpen(false);
        setViewingNote(null);
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        resetForm();
    };

    const handleSubmit = async () => {
        try {
            if (editingNote) {
                // Update existing note
                await api.updateNote(editingNote.id, {
                    title: formData.title,
                    content: formData.content,
                    tags: formData.tags,
                    updatedAt: Date.now(),
                });
            } else {
                // Create new note
                await api.createNote({
                    title: formData.title,
                    content: formData.content,
                    tags: formData.tags,
                    pinned: false,
                });
            }
            await loadData();
            closeDialog();
        } catch (error) {
            console.error('Failed to save note:', error);
        }
    };

    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    const confirmDelete = async () => {
        if (!pendingDeleteId) return;
        try {
            await api.deleteNote(pendingDeleteId);
            await loadData();
        } catch (error) {
            console.error('Failed to delete note:', error);
        } finally {
            setPendingDeleteId(null);
        }
    };

    const togglePin = async (note: Note) => {
        try {
            await api.updateNote(note.id, {
                pinned: !note.pinned,
                updatedAt: Date.now(),
            });
            await loadData();
        } catch (error) {
            console.error('Failed to toggle pin:', error);
        }
    };

    const addTag = () => {
        setFormData((prev) => ({
            ...prev,
            tags: [...prev.tags, ''],
        }));
    };

    const updateTag = (index: number, value: string) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags.map((tag, i) => (i === index ? value : tag)),
        }));
    };

    const removeTag = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags.filter((_, i) => i !== index),
        }));
    };

    if (!data) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-48"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...Array(4)].map((_, index) => (
                            <div
                                key={`loading-note-${index.toString()}`}
                                className="h-32 bg-muted rounded"
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Filter notes based on search query
    const filteredNotes = data.notes.filter((note) => {
        if (!debouncedSearchQuery) return true;
        const query = debouncedSearchQuery.toLowerCase();
        // Strip HTML tags for searching
        const plainContent = note.content
            .replace(/<[^>]*>/g, ' ')
            .toLowerCase();
        return (
            note.title.toLowerCase().includes(query) ||
            plainContent.includes(query) ||
            note.tags.some((tag) => tag.toLowerCase().includes(query))
        );
    });

    // Sort notes: pinned first, then by updated date
    const sortedNotes = [...filteredNotes].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.updatedAt - a.updatedAt;
    });

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Notes</h1>
                    <p className="text-muted-foreground">
                        Keep track of your thoughts and ideas.
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreateDialog}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Note
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>
                                {editingNote ? 'Edit Note' : 'Create Note'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingNote
                                    ? 'Update your note details below.'
                                    : 'Add a new note to keep track of your thoughts.'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div>
                                <label
                                    htmlFor="note-title"
                                    className="text-sm font-medium"
                                >
                                    Title
                                </label>
                                <Input
                                    id="note-title"
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            title: e.target.value,
                                        }))
                                    }
                                    placeholder="Note title"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="note-content"
                                    className="text-sm font-medium mb-2 block"
                                >
                                    Content
                                </label>
                                <RichTextEditor
                                    content={formData.content}
                                    onChange={(content) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            content,
                                        }))
                                    }
                                    placeholder="Write your note here..."
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label
                                        htmlFor="tags"
                                        className="text-sm font-medium"
                                    >
                                        Tags
                                    </label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addTag}
                                    >
                                        Add Tag
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {formData.tags.map((tag, index) => (
                                        <div
                                            key={`tag-input-${index.toString()}`}
                                            className="flex gap-2"
                                        >
                                            <Input
                                                value={tag}
                                                onChange={(e) =>
                                                    updateTag(
                                                        index,
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Enter tag"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => removeTag(index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={closeDialog}>
                                Cancel
                            </Button>
                            <Button onClick={handleSubmit}>
                                {editingNote ? 'Update' : 'Create'} Note
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* View Note Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    {viewingNote && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center justify-between">
                                    <DialogTitle className="text-2xl flex items-center gap-2">
                                        {viewingNote.pinned && (
                                            <Pin className="h-5 w-5 text-primary" />
                                        )}
                                        {viewingNote.title}
                                    </DialogTitle>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                togglePin(viewingNote)
                                            }
                                            className={
                                                viewingNote.pinned
                                                    ? 'text-primary'
                                                    : ''
                                            }
                                        >
                                            <Pin className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                openEditDialog(viewingNote)
                                            }
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setPendingDeleteId(
                                                    viewingNote.id,
                                                );
                                                closeViewDialog();
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <DialogDescription>
                                    Last updated:{' '}
                                    {new Date(
                                        viewingNote.updatedAt,
                                    ).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="mt-4">
                                <div
                                    className="prose prose-sm max-w-none dark:prose-invert"
                                    // biome-ignore lint/security/noDangerouslySetInnerHtml: this is sanitized
                                    dangerouslySetInnerHTML={{
                                        __html: DOMPurify.sanitize(
                                            viewingNote.content,
                                        ),
                                    }}
                                />
                            </div>

                            {viewingNote.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-6">
                                    {viewingNote.tags.map((tag) => (
                                        <Badge
                                            key={tag}
                                            variant="secondary"
                                            className="text-sm"
                                        >
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Notes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedNotes.map((note) => (
                    <Card
                        key={note.id}
                        className={`cursor-pointer hover:border-primary/50 hover:shadow-md transition-all ${note.pinned ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => openViewDialog(note)}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        {note.pinned && (
                                            <Pin className="h-4 w-4 text-primary" />
                                        )}
                                        {note.title}
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        {new Date(
                                            note.updatedAt,
                                        ).toLocaleDateString()}
                                    </CardDescription>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            togglePin(note);
                                        }}
                                        className={
                                            note.pinned ? 'text-primary' : ''
                                        }
                                    >
                                        <Pin className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openEditDialog(note);
                                        }}
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPendingDeleteId(note.id);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div
                                className="text-sm text-muted-foreground line-clamp-4 prose prose-sm max-w-none"
                                // biome-ignore lint/security/noDangerouslySetInnerHtml: this is sanitized
                                dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(note.content),
                                }}
                            />
                            {note.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-3">
                                    {note.tags.map((tag) => (
                                        <Badge
                                            key={tag}
                                            variant="secondary"
                                            className="text-xs"
                                        >
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {sortedNotes.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-muted-foreground">
                        {searchQuery
                            ? 'No notes match your search.'
                            : 'No notes yet.'}
                    </div>
                    {!searchQuery && (
                        <Button onClick={openCreateDialog} className="mt-4">
                            <Plus className="h-4 w-4 mr-2" />
                            Create your first note
                        </Button>
                    )}
                </div>
            )}
            <AlertDialog
                open={pendingDeleteId !== null}
                onOpenChange={(open) => {
                    if (!open) setPendingDeleteId(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete note</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this note? This
                            action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
