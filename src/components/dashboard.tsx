import { useNavigate } from '@tanstack/react-router';
import { format, parseISO, startOfToday } from 'date-fns';
import {
    CheckSquare,
    Clock,
    LogIn,
    LogOut,
    StickyNote,
    Target,
    Timer,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ClockOutDialog } from '@/components/clock-out-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';
import { isHabitCompletedToday } from '@/lib/utils';
import type { AppData, WorkLogEntry } from '@/shared/rpc-types';

const BLOCK_TAGS = new Set([
    'P',
    'DIV',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'LI',
    'BR',
    'BLOCKQUOTE',
    'PRE',
    'TR',
]);

function extractText(node: Node, parts: string[]): void {
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) parts.push(text);
        return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    if (BLOCK_TAGS.has(el.tagName) && parts.length > 0) {
        parts.push(' ');
    }
    for (const child of el.childNodes) {
        extractText(child, parts);
    }
}

const stripHtml = (html: string): string => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const parts: string[] = [];
    extractText(tmp, parts);
    return parts.join('').replace(/\s+/g, ' ').trim();
};

export function Dashboard() {
    const [data, setData] = useState<AppData | null>(null);
    const [clockOutOpen, setClockOutOpen] = useState(false);
    const navigate = useNavigate();

    const loadData = useCallback(async () => {
        try {
            const appData = await api.getAppData();
            setData(appData);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    }, []);

    useEffect(() => {
        loadData();

        const onClockChange = () => loadData();
        window.addEventListener('clock-state-changed', onClockChange);
        return () =>
            window.removeEventListener('clock-state-changed', onClockChange);
    }, [loadData]);

    const activeSession: WorkLogEntry | undefined = data?.workLogs.find(
        (log) => log.startTime && !log.endTime,
    );

    const lastCompletedSession: WorkLogEntry | undefined = data?.workLogs
        .filter((log) => log.startTime && log.endTime)
        .sort((a, b) => b.timestamp - a.timestamp)[0];

    const handleClockIn = async () => {
        const now = new Date();
        await api.createWorkLog({
            date: format(now, 'yyyy-MM-dd'),
            description: '',
            tags: [],
            startTime: format(now, 'HH:mm'),
        });
        await loadData();
    };

    const handleClockOut = async (description: string, tags: string[]) => {
        if (!activeSession) return;
        const now = new Date();
        await api.updateWorkLog(activeSession.id, {
            description,
            tags,
            endTime: format(now, 'HH:mm'),
        });
        setClockOutOpen(false);
        await loadData();
    };

    if (!data) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-48"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, index) => (
                            <div
                                key={`loading-card-${index.toString()}`}
                                className="h-32 bg-muted rounded"
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Calculate today's stats
    const today = startOfToday();
    const todayStr = format(today, 'yyyy-MM-dd');

    const todaysWorkLogs = data.workLogs.filter((log) => log.date === todayStr);
    const todaysTodos = data.todos.filter(
        (todo) =>
            todo.dueDate === todayStr || (!todo.dueDate && !todo.completed),
    );
    const todaysPomodoroSessions = data.pomodoroSessions.filter(
        (session) => session.date === todayStr,
    );

    const completedTodosToday = todaysTodos.filter(
        (todo) => todo.completed,
    ).length;
    const totalTodosToday = todaysTodos.length;

    const pinnedNotes = data.notes.filter((note) => note.pinned);

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">
                    Welcome back! Here's your productivity overview for{' '}
                    {format(today, 'EEEE, MMMM do')}.
                </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {activeSession ? (
                    <div className="flex flex-col gap-1">
                        <Button
                            className="h-20 flex flex-col gap-2"
                            variant="destructive"
                            size="lg"
                            onClick={() => setClockOutOpen(true)}
                        >
                            <LogOut className="h-6 w-6" />
                            <span>Clock Out</span>
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                            Clocked in since {activeSession.startTime}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1">
                        <Button
                            className="h-20 flex flex-col gap-2"
                            size="lg"
                            onClick={handleClockIn}
                        >
                            <LogIn className="h-6 w-6" />
                            <span>Clock In</span>
                        </Button>
                        {lastCompletedSession && (
                            <p className="text-xs text-muted-foreground text-center truncate max-w-[200px] mx-auto">
                                Last: {lastCompletedSession.description}
                            </p>
                        )}
                    </div>
                )}
                <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2"
                    size="lg"
                    onClick={() => navigate({ to: '/todos' })}
                >
                    <CheckSquare className="h-6 w-6" />
                    <span>Add Todo</span>
                </Button>
                <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2"
                    size="lg"
                    onClick={() => navigate({ to: '/pomodoro' })}
                >
                    <Timer className="h-6 w-6" />
                    <span>Start Pomodoro</span>
                </Button>
                <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2"
                    size="lg"
                    onClick={() => navigate({ to: '/notes' })}
                >
                    <StickyNote className="h-6 w-6" />
                    <span>Add Note</span>
                </Button>
            </div>

            {/* Today's Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Today's Work
                        </CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">
                            {todaysWorkLogs.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {todaysWorkLogs.length === 1
                                ? 'session'
                                : 'sessions'}{' '}
                            logged
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Todos
                        </CardTitle>
                        <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">
                            {completedTodosToday}/{totalTodosToday}
                        </div>
                        <Progress
                            value={
                                totalTodosToday > 0
                                    ? (completedTodosToday / totalTodosToday) *
                                      100
                                    : 0
                            }
                            className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            {totalTodosToday - completedTodosToday} remaining
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Pomodoro Sessions
                        </CardTitle>
                        <Timer className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">
                            {todaysPomodoroSessions.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {
                                todaysPomodoroSessions.filter(
                                    (s) => s.completed,
                                ).length
                            }{' '}
                            completed
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Habits
                        </CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">
                            {
                                data.habits.filter((h) =>
                                    isHabitCompletedToday(h.completedDates),
                                ).length
                            }
                            /{data.habits.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            completed today
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Work Logs */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Work</CardTitle>
                        <CardDescription>
                            Your latest work sessions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {data.workLogs
                                .slice(-5)
                                .reverse()
                                .map((log) => (
                                    <div
                                        key={log.id}
                                        className="flex items-center justify-between"
                                    >
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">
                                                {log.description}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {log.startTime}
                                                {log.endTime &&
                                                    ` - ${log.endTime}`}
                                                {log.tags.length > 0 && ' • '}
                                                {log.tags.map((tag) => (
                                                    <Badge
                                                        key={tag}
                                                        variant="secondary"
                                                        className="text-xs ml-1"
                                                    >
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </p>
                                        </div>
                                        {log.duration && (
                                            <Badge variant="outline">
                                                {log.duration}m
                                            </Badge>
                                        )}
                                    </div>
                                ))}
                            {data.workLogs.length === 0 && (
                                <div className="text-center py-4">
                                    <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground mb-3">
                                        No work sessions yet
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            navigate({ to: '/work-log' })
                                        }
                                    >
                                        Log your first session
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Pinned Notes */}
                <Card>
                    <CardHeader>
                        <CardTitle>Pinned Notes</CardTitle>
                        <CardDescription>
                            Your important reminders
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {pinnedNotes.map((note) => (
                                <button
                                    key={note.id}
                                    className="w-full text-left p-3 bg-muted rounded-md cursor-pointer hover:bg-muted/80 hover:ring-1 hover:ring-primary/30 transition-all"
                                    onClick={() => navigate({ to: '/notes' })}
                                    onKeyDown={(e) => {
                                        if (
                                            e.key === 'Enter' ||
                                            e.key === ' '
                                        ) {
                                            e.preventDefault();
                                            navigate({ to: '/notes' });
                                        }
                                    }}
                                    type="button"
                                    tabIndex={0}
                                >
                                    <h4 className="font-medium text-sm">
                                        {note.title}
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                        {stripHtml(note.content)}
                                    </p>
                                </button>
                            ))}
                            {pinnedNotes.length === 0 && (
                                <div className="text-center py-4">
                                    <StickyNote className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground mb-3">
                                        No pinned notes
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            navigate({ to: '/notes' })
                                        }
                                    >
                                        Create a note
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Upcoming Todos */}
            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Todos</CardTitle>
                    <CardDescription>Tasks due soon</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {data.todos
                            .filter((todo) => !todo.completed)
                            .sort((a, b) => {
                                if (!a.dueDate && !b.dueDate) return 0;
                                if (!a.dueDate) return 1;
                                if (!b.dueDate) return -1;
                                return (
                                    new Date(a.dueDate).getTime() -
                                    new Date(b.dueDate).getTime()
                                );
                            })
                            .slice(0, 5)
                            .map((todo) => (
                                <div
                                    key={todo.id}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">
                                            {todo.title}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {todo.dueDate && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    Due{' '}
                                                    {format(
                                                        parseISO(todo.dueDate),
                                                        'MMM d',
                                                    )}
                                                </Badge>
                                            )}
                                            <Badge
                                                variant={
                                                    todo.priority === 'high'
                                                        ? 'destructive'
                                                        : todo.priority ===
                                                            'medium'
                                                          ? 'default'
                                                          : 'secondary'
                                                }
                                                className="text-xs"
                                            >
                                                {todo.priority}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        {data.todos.filter((todo) => !todo.completed).length ===
                            0 && (
                            <div className="text-center py-4">
                                <CheckSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground mb-3">
                                    No pending todos
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate({ to: '/todos' })}
                                >
                                    Add a todo
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <ClockOutDialog
                open={clockOutOpen}
                onOpenChange={setClockOutOpen}
                onClockOut={handleClockOut}
                clockedInSince={activeSession?.startTime}
            />
        </div>
    );
}
