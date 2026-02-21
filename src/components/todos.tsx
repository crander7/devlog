import { format, isFuture, isPast, isToday, parseISO } from 'date-fns';
import {
    Calendar,
    CheckSquare,
    Edit2,
    Filter,
    Plus,
    Search,
    Tag,
    Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useDebounce } from '@/hooks/use-debounce';
import type { Todo } from '@/types/electron';

interface TodoFormData {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    dueDate: string;
    tags: string[];
}

type FilterType =
    | 'all'
    | 'pending'
    | 'completed'
    | 'overdue'
    | 'today'
    | 'upcoming';

export function Todos() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
    const [filter, setFilter] = useState<FilterType>('all');
    const [tagFilter, setTagFilter] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [formData, setFormData] = useState<TodoFormData>({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        tags: [],
    });

    const loadTodos = useCallback(async () => {
        try {
            const data = await window.electronAPI.getAppData();
            setTodos(data.todos);
        } catch (error) {
            console.error('Failed to load todos:', error);
        }
    }, []);

    useEffect(() => {
        loadTodos();
    }, [loadTodos]);

    const handleSubmit = async () => {
        try {
            const todoData = {
                title: formData.title,
                description: formData.description || undefined,
                priority: formData.priority,
                dueDate: formData.dueDate || undefined,
                tags: formData.tags.filter((tag) => tag.trim()),
                completed: false,
            };

            if (editingTodo) {
                await window.electronAPI.updateTodo(editingTodo.id, todoData);
            } else {
                await window.electronAPI.createTodo(todoData);
            }

            await loadTodos();
            resetForm();
            setIsDialogOpen(false);
        } catch (error) {
            console.error('Failed to save todo:', error);
        }
    };

    const handleToggleComplete = async (id: string) => {
        try {
            const todo = todos.find((t) => t.id === id);
            if (todo) {
                await window.electronAPI.updateTodo(id, {
                    completed: !todo.completed,
                });
                await loadTodos();
            }
        } catch (error) {
            console.error('Failed to toggle todo:', error);
        }
    };

    const handleEdit = (todo: Todo) => {
        setEditingTodo(todo);
        setFormData({
            title: todo.title,
            description: todo.description || '',
            priority: todo.priority,
            dueDate: todo.dueDate || '',
            tags: todo.tags,
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await window.electronAPI.deleteTodo(id);
            await loadTodos();
        } catch (error) {
            console.error('Failed to delete todo:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            priority: 'medium',
            dueDate: '',
            tags: [],
        });
        setEditingTodo(null);
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

    // Filter and search todos
    const filteredTodos = useMemo(() => {
        let filtered = todos;

        // Status filter
        switch (filter) {
            case 'pending':
                filtered = filtered.filter((todo) => !todo.completed);
                break;
            case 'completed':
                filtered = filtered.filter((todo) => todo.completed);
                break;
            case 'overdue':
                filtered = filtered.filter(
                    (todo) =>
                        !todo.completed &&
                        todo.dueDate &&
                        isPast(parseISO(todo.dueDate)) &&
                        !isToday(parseISO(todo.dueDate)),
                );
                break;
            case 'today':
                filtered = filtered.filter(
                    (todo) => todo.dueDate && isToday(parseISO(todo.dueDate)),
                );
                break;
            case 'upcoming':
                filtered = filtered.filter(
                    (todo) => todo.dueDate && isFuture(parseISO(todo.dueDate)),
                );
                break;
        }

        // Tag filter
        if (tagFilter && tagFilter !== 'all') {
            filtered = filtered.filter((todo) =>
                todo.tags.some((tag) =>
                    tag.toLowerCase().includes(tagFilter.toLowerCase()),
                ),
            );
        }

        // Search filter
        if (debouncedSearchQuery) {
            const query = debouncedSearchQuery.toLowerCase();
            filtered = filtered.filter(
                (todo) =>
                    todo.title.toLowerCase().includes(query) ||
                    todo.description?.toLowerCase().includes(query) ||
                    todo.tags.some((tag) => tag.toLowerCase().includes(query)),
            );
        }

        return filtered;
    }, [todos, filter, tagFilter, debouncedSearchQuery]);

    // Sort todos by priority and due date
    const sortedTodos = useMemo(() => {
        return [...filteredTodos].sort((a, b) => {
            // Completed items go to bottom
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }

            // Priority sorting
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            const priorityDiff =
                priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0) return priorityDiff;

            // Due date sorting
            if (a.dueDate && b.dueDate) {
                return (
                    new Date(a.dueDate).getTime() -
                    new Date(b.dueDate).getTime()
                );
            }
            if (a.dueDate) return -1;
            if (b.dueDate) return 1;

            // Creation date sorting
            return b.createdAt - a.createdAt;
        });
    }, [filteredTodos]);

    // Get all unique tags
    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        todos.forEach((todo) => {
            todo.tags.forEach((tag) => {
                tagSet.add(tag);
            });
        });
        return Array.from(tagSet).sort();
    }, [todos]);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'destructive';
            case 'medium':
                return 'default';
            case 'low':
                return 'secondary';
            default:
                return 'secondary';
        }
    };

    const getDueDateStatus = (dueDate?: string) => {
        if (!dueDate) return null;

        const date = parseISO(dueDate);
        if (isToday(date))
            return { text: 'Today', variant: 'default' as const };
        if (isPast(date) && !isToday(date))
            return { text: 'Overdue', variant: 'destructive' as const };
        return { text: format(date, 'MMM d'), variant: 'outline' as const };
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Todos</h1>
                    <p className="text-muted-foreground">
                        Manage your tasks and stay organized
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Todo
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {editingTodo ? 'Edit Todo' : 'Add Todo'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingTodo
                                    ? 'Update your todo details.'
                                    : 'Create a new todo to track your tasks.'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div>
                                <label
                                    htmlFor="todo-title"
                                    className="text-sm font-medium"
                                >
                                    Title
                                </label>
                                <Input
                                    id="todo-title"
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            title: e.target.value,
                                        }))
                                    }
                                    placeholder="What needs to be done?"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="todo-description"
                                    className="text-sm font-medium"
                                >
                                    Description (Optional)
                                </label>
                                <Textarea
                                    id="todo-description"
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                    placeholder="Additional details..."
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label
                                        htmlFor="todo-priority"
                                        className="text-sm font-medium"
                                    >
                                        Priority
                                    </label>
                                    <Select
                                        value={formData.priority}
                                        onValueChange={(
                                            value: 'low' | 'medium' | 'high',
                                        ) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                priority: value,
                                            }))
                                        }
                                    >
                                        <SelectTrigger id="todo-priority">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">
                                                Low
                                            </SelectItem>
                                            <SelectItem value="medium">
                                                Medium
                                            </SelectItem>
                                            <SelectItem value="high">
                                                High
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label
                                        htmlFor="todo-due-date"
                                        className="text-sm font-medium"
                                    >
                                        Due Date (Optional)
                                    </label>
                                    <Input
                                        id="todo-due-date"
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                dueDate: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
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
                                            key={`tag-input-${index.toString()}-${Math.random()}`}
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
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={!formData.title.trim()}
                            >
                                {editingTodo ? 'Update' : 'Add'} Todo
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search todos..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <Select
                            value={filter}
                            onValueChange={(value: FilterType) =>
                                setFilter(value)
                            }
                        >
                            <SelectTrigger className="w-[150px]">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="completed">
                                    Completed
                                </SelectItem>
                                <SelectItem value="overdue">Overdue</SelectItem>
                                <SelectItem value="today">Due Today</SelectItem>
                                <SelectItem value="upcoming">
                                    Upcoming
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={tagFilter} onValueChange={setTagFilter}>
                            <SelectTrigger className="w-[150px]">
                                <Tag className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="All Tags" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Tags</SelectItem>
                                {allTags.map((tag) => (
                                    <SelectItem key={tag} value={tag}>
                                        {tag}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Todo List */}
            <div className="space-y-3">
                {sortedTodos.map((todo) => {
                    const dueDateStatus = getDueDateStatus(todo.dueDate);

                    return (
                        <Card
                            key={todo.id}
                            className={todo.completed ? 'opacity-60' : ''}
                        >
                            <CardContent className="pt-4">
                                <div className="flex items-start gap-4">
                                    <Checkbox
                                        checked={todo.completed}
                                        onCheckedChange={() =>
                                            handleToggleComplete(todo.id)
                                        }
                                        className="mt-1"
                                    />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <h3
                                                    className={`font-medium ${todo.completed ? 'line-through text-muted-foreground' : ''}`}
                                                >
                                                    {todo.title}
                                                </h3>
                                                {todo.description && (
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {todo.description}
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-2 mt-3">
                                                    <Badge
                                                        variant={getPriorityColor(
                                                            todo.priority,
                                                        )}
                                                    >
                                                        {todo.priority}
                                                    </Badge>

                                                    {dueDateStatus && (
                                                        <Badge
                                                            variant={
                                                                dueDateStatus.variant
                                                            }
                                                        >
                                                            <Calendar className="h-3 w-3 mr-1" />
                                                            {dueDateStatus.text}
                                                        </Badge>
                                                    )}

                                                    {todo.tags.map((tag) => (
                                                        <Badge
                                                            key={tag}
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleEdit(todo)
                                                    }
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>
                                                                Delete Todo
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you
                                                                want to delete
                                                                this todo? This
                                                                action cannot be
                                                                undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>
                                                                Cancel
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        todo.id,
                                                                    )
                                                                }
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {sortedTodos.length === 0 && (
                    <Card>
                        <CardContent className="py-12">
                            <div className="text-center">
                                <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-medium">
                                    {filter === 'all' &&
                                    !searchQuery &&
                                    !tagFilter
                                        ? 'No todos yet'
                                        : 'No todos match your filters'}
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    {filter === 'all' &&
                                    !searchQuery &&
                                    !tagFilter
                                        ? 'Create your first todo to get started.'
                                        : 'Try adjusting your filters or search query.'}
                                </p>
                                {filter === 'all' &&
                                    !searchQuery &&
                                    !tagFilter && (
                                        <Button
                                            onClick={() =>
                                                setIsDialogOpen(true)
                                            }
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Your First Todo
                                        </Button>
                                    )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
