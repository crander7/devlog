import { useNavigate } from '@tanstack/react-router';
import {
    CheckSquare,
    FileText,
    Home,
    LayoutDashboard,
    Plus,
    Search,
    Settings,
    StickyNote,
    Target,
    Timer,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface Command {
    id: string;
    title: string;
    description?: string;
    icon: React.ComponentType<{ className?: string }>;
    action: () => void;
    category: string;
    keywords?: string[];
}

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
                setSearchValue('');
                setSelectedIndex(0);
            }
            if (e.key === 'Escape') {
                setOpen(false);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const commands: Command[] = [
        // Navigation
        {
            id: 'dashboard',
            title: 'Go to Dashboard',
            description: 'View your productivity overview',
            icon: LayoutDashboard,
            category: 'Navigation',
            action: () => {
                navigate({ to: '/' });
                setOpen(false);
            },
            keywords: ['home', 'overview', 'main'],
        },
        {
            id: 'work-log',
            title: 'Go to Work Log',
            description: 'Manage your work sessions',
            icon: FileText,
            category: 'Navigation',
            action: () => {
                navigate({ to: '/work-log' });
                setOpen(false);
            },
            keywords: ['work', 'log', 'sessions', 'time'],
        },
        {
            id: 'todos',
            title: 'Go to Todos',
            description: 'Manage your tasks and todos',
            icon: CheckSquare,
            category: 'Navigation',
            action: () => {
                navigate({ to: '/todos' });
                setOpen(false);
            },
            keywords: ['tasks', 'todo', 'list'],
        },
        {
            id: 'pomodoro',
            title: 'Go to Pomodoro',
            description: 'Start a focus session',
            icon: Timer,
            category: 'Navigation',
            action: () => {
                navigate({ to: '/pomodoro' });
                setOpen(false);
            },
            keywords: ['timer', 'focus', 'concentration'],
        },
        {
            id: 'notes',
            title: 'Go to Notes',
            description: 'View and manage your notes',
            icon: StickyNote,
            category: 'Navigation',
            action: () => {
                navigate({ to: '/notes' });
                setOpen(false);
            },
            keywords: ['notes', 'ideas', 'reminders'],
        },
        {
            id: 'habits',
            title: 'Go to Habits',
            description: 'Track your daily habits',
            icon: Target,
            category: 'Navigation',
            action: () => {
                navigate({ to: '/habits' });
                setOpen(false);
            },
            keywords: ['habits', 'routine', 'streaks'],
        },
        {
            id: 'stats',
            title: 'Go to Stats',
            description: 'View your productivity statistics',
            icon: Home,
            category: 'Navigation',
            action: () => {
                navigate({ to: '/stats' });
                setOpen(false);
            },
            keywords: ['statistics', 'analytics', 'progress'],
        },
        {
            id: 'settings',
            title: 'Go to Settings',
            description: 'Configure your preferences',
            icon: Settings,
            category: 'Navigation',
            action: () => {
                navigate({ to: '/settings' });
                setOpen(false);
            },
            keywords: ['settings', 'preferences', 'config'],
        },

        // Quick Actions
        {
            id: 'add-work-log',
            title: 'Add Work Log',
            description: 'Create a new work session entry',
            icon: Plus,
            category: 'Quick Actions',
            action: () => {
                navigate({ to: '/work-log' });
                setOpen(false);
            },
            keywords: ['new', 'work', 'log', 'entry'],
        },
        {
            id: 'add-todo',
            title: 'Add Todo',
            description: 'Create a new task',
            icon: Plus,
            category: 'Quick Actions',
            action: () => {
                navigate({ to: '/todos' });
                setOpen(false);
            },
            keywords: ['new', 'task', 'todo'],
        },
        {
            id: 'add-note',
            title: 'Add Note',
            description: 'Create a new note',
            icon: Plus,
            category: 'Quick Actions',
            action: () => {
                navigate({ to: '/notes' });
                setOpen(false);
            },
            keywords: ['new', 'note', 'idea'],
        },
        {
            id: 'start-pomodoro',
            title: 'Start Pomodoro',
            description: 'Begin a focus session',
            icon: Timer,
            category: 'Quick Actions',
            action: () => {
                navigate({ to: '/pomodoro' });
                setOpen(false);
            },
            keywords: ['start', 'focus', 'timer'],
        },
    ];

    const filteredCommands = commands.filter((command) => {
        if (!searchValue) return true;
        const searchTerm = searchValue.toLowerCase();
        const matchesTitle = command.title.toLowerCase().includes(searchTerm);
        const matchesDescription = command.description
            ?.toLowerCase()
            .includes(searchTerm);
        const matchesKeywords = command.keywords?.some((keyword) =>
            keyword.toLowerCase().includes(searchTerm),
        );
        const matchesCategory = command.category
            .toLowerCase()
            .includes(searchTerm);

        return (
            matchesTitle ||
            matchesDescription ||
            matchesKeywords ||
            matchesCategory
        );
    });

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!open) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex((prev) =>
                        prev < filteredCommands.length - 1 ? prev + 1 : prev,
                    );
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (filteredCommands[selectedIndex]) {
                        filteredCommands[selectedIndex].action();
                    }
                    break;
            }
        },
        [open, filteredCommands, selectedIndex],
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[600px] p-0">
                <DialogHeader className="px-4 py-3 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Command Palette
                    </DialogTitle>
                </DialogHeader>

                <div className="px-4 py-2">
                    <Input
                        placeholder="Type a command or search..."
                        value={searchValue}
                        onChange={(e) => {
                            setSearchValue(e.target.value);
                            setSelectedIndex(0);
                        }}
                        autoFocus
                    />
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                    {filteredCommands.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                            <Search className="mx-auto h-8 w-8 mb-2 opacity-50" />
                            <p>No commands found.</p>
                            <p className="text-xs">
                                Try searching for navigation, actions, or
                                specific features.
                            </p>
                        </div>
                    ) : (
                        <div className="px-2">
                            {['Navigation', 'Quick Actions'].map((category) => {
                                const categoryCommands =
                                    filteredCommands.filter(
                                        (cmd) => cmd.category === category,
                                    );
                                if (categoryCommands.length === 0) return null;

                                return (
                                    <div key={category} className="mb-4">
                                        <h3 className="px-2 py-1 text-sm font-medium text-muted-foreground">
                                            {category}
                                        </h3>
                                        <div className="space-y-1">
                                            {categoryCommands.map(
                                                (command, _index) => {
                                                    const Icon = command.icon;
                                                    const globalIndex =
                                                        filteredCommands.indexOf(
                                                            command,
                                                        );
                                                    const isSelected =
                                                        globalIndex ===
                                                        selectedIndex;

                                                    return (
                                                        <button
                                                            key={command.id}
                                                            type="button"
                                                            onClick={
                                                                command.action
                                                            }
                                                            className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md hover:bg-accent transition-colors ${
                                                                isSelected
                                                                    ? 'bg-accent'
                                                                    : ''
                                                            }`}
                                                        >
                                                            <Icon className="h-4 w-4 flex-shrink-0" />
                                                            <div className="flex-1">
                                                                <div className="font-medium">
                                                                    {
                                                                        command.title
                                                                    }
                                                                </div>
                                                                {command.description && (
                                                                    <div className="text-sm text-muted-foreground">
                                                                        {
                                                                            command.description
                                                                        }
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {command.keywords &&
                                                                command.keywords
                                                                    .length >
                                                                    0 && (
                                                                    <div className="flex gap-1">
                                                                        {command.keywords
                                                                            .slice(
                                                                                0,
                                                                                2,
                                                                            )
                                                                            .map(
                                                                                (
                                                                                    keyword,
                                                                                ) => (
                                                                                    <Badge
                                                                                        key={
                                                                                            keyword
                                                                                        }
                                                                                        variant="secondary"
                                                                                        className="text-xs"
                                                                                    >
                                                                                        {
                                                                                            keyword
                                                                                        }
                                                                                    </Badge>
                                                                                ),
                                                                            )}
                                                                    </div>
                                                                )}
                                                        </button>
                                                    );
                                                },
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                        <span>↑↓ Navigate</span>
                        <span>↵ Select</span>
                        <span>Esc Close</span>
                    </div>
                    <div>
                        {filteredCommands.length > 0 && (
                            <span>
                                {selectedIndex + 1} of {filteredCommands.length}
                            </span>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
