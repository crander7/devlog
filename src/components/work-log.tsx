import { format, parseISO } from 'date-fns';
import {
    Calendar,
    Clock,
    Edit2,
    LogIn,
    LogOut,
    Plus,
    Tag,
    Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ClockOutDialog } from '@/components/clock-out-dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import type { WorkLogEntry } from '@/shared/rpc-types';

interface WorkLogFormData {
    description: string;
    tags: string[];
    startTime: string;
    endTime?: string;
}

export function WorkLog() {
    const [workLogs, setWorkLogs] = useState<WorkLogEntry[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [clockOutOpen, setClockOutOpen] = useState(false);
    const [editingLog, setEditingLog] = useState<WorkLogEntry | null>(null);
    const [formData, setFormData] = useState<WorkLogFormData>({
        description: '',
        tags: [],
        startTime: format(new Date(), 'HH:mm'),
    });

    const loadWorkLogs = useCallback(async () => {
        try {
            const data = await api.getAllEntries();
            setWorkLogs(data);
        } catch (error) {
            console.error('Failed to load work logs:', error);
        }
    }, []);

    const activeSession = workLogs.find((log) => log.startTime && !log.endTime);

    const lastCompletedSession = workLogs
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
        await loadWorkLogs();
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
        await loadWorkLogs();
    };

    useEffect(() => {
        loadWorkLogs();

        const onClockChange = () => loadWorkLogs();
        window.addEventListener('clock-state-changed', onClockChange);
        return () =>
            window.removeEventListener('clock-state-changed', onClockChange);
    }, [loadWorkLogs]);

    const handleSubmit = async () => {
        try {
            const now = new Date();
            const logData = {
                date: format(now, 'yyyy-MM-dd'),
                description: formData.description,
                tags: formData.tags.filter((tag) => tag.trim()),
                startTime: formData.startTime,
                endTime: formData.endTime,
            };

            if (editingLog) {
                await api.updateWorkLog(editingLog.id, logData);
            } else {
                await api.createWorkLog(logData);
            }

            await loadWorkLogs();
            resetForm();
            setIsDialogOpen(false);
        } catch (error) {
            console.error('Failed to save work log:', error);
        }
    };

    const handleEdit = (log: WorkLogEntry) => {
        setEditingLog(log);
        setFormData({
            description: log.description,
            tags: log.tags,
            startTime: log.startTime || '',
            endTime: log.endTime,
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await api.deleteWorkLog(id);
            await loadWorkLogs();
        } catch (error) {
            console.error('Failed to delete work log:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            description: '',
            tags: [],
            startTime: format(new Date(), 'HH:mm'),
        });
        setEditingLog(null);
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

    // Group logs by date
    const groupedLogs = workLogs.reduce(
        (acc, log) => {
            const date = log.date;
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(log);
            return acc;
        },
        {} as Record<string, WorkLogEntry[]>,
    );

    // Sort dates in descending order
    const sortedDates = Object.keys(groupedLogs).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Work Log</h1>
                    <p className="text-muted-foreground">
                        Track your daily work sessions and activities
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Entry
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingLog
                                    ? 'Edit Work Log'
                                    : 'Add Work Log Entry'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingLog
                                    ? 'Update your work log entry details.'
                                    : 'Add a new work log entry with description and tags.'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div>
                                <label
                                    htmlFor="work-description"
                                    className="text-sm font-medium"
                                >
                                    Description
                                </label>
                                <Textarea
                                    id="work-description"
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                    placeholder="What did you work on?"
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="start-time"
                                    className="text-sm font-medium"
                                >
                                    Start Time
                                </label>
                                <Input
                                    id="start-time"
                                    type="time"
                                    value={formData.startTime}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            startTime: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="end-time"
                                    className="text-sm font-medium"
                                >
                                    End Time (Optional)
                                </label>
                                <Input
                                    id="end-time"
                                    type="time"
                                    value={formData.endTime || ''}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            endTime:
                                                e.target.value || undefined,
                                        }))
                                    }
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
                                disabled={!formData.description.trim()}
                            >
                                {editingLog ? 'Update' : 'Add'} Entry
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Clock In/Out Bar */}
            <Card className={activeSession ? 'border-primary/50' : ''}>
                <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                        {activeSession ? (
                            <>
                                <div className="flex items-center gap-3">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                                    </span>
                                    <span className="text-sm font-medium">
                                        Clocked in since{' '}
                                        {activeSession.startTime}
                                    </span>
                                </div>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setClockOutOpen(true)}
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Clock Out
                                </Button>
                            </>
                        ) : (
                            <>
                                <div className="text-sm text-muted-foreground">
                                    {lastCompletedSession
                                        ? `Last session: ${lastCompletedSession.description}`
                                        : 'Ready to start working?'}
                                </div>
                                <Button size="sm" onClick={handleClockIn}>
                                    <LogIn className="h-4 w-4 mr-2" />
                                    Clock In
                                </Button>
                            </>
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

            <div className="space-y-6">
                {sortedDates.map((date) => {
                    const logs = groupedLogs[date];
                    const totalDuration = logs.reduce((sum, log) => {
                        if (log.startTime && log.endTime) {
                            const start = new Date(`${date}T${log.startTime}`);
                            const end = new Date(`${date}T${log.endTime}`);
                            return (
                                sum +
                                (end.getTime() - start.getTime()) / (1000 * 60)
                            ); // minutes
                        }
                        return sum;
                    }, 0);

                    return (
                        <Card key={date}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    {format(
                                        parseISO(date),
                                        'EEEE, MMMM do, yyyy',
                                    )}
                                </CardTitle>
                                <CardDescription>
                                    {logs.length}{' '}
                                    {logs.length === 1 ? 'entry' : 'entries'}
                                    {totalDuration > 0 &&
                                        ` • ${Math.round(totalDuration)} minutes total`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {logs.map((log) => {
                                        const isActive =
                                            log.startTime && !log.endTime;
                                        return (
                                            <div
                                                key={log.id}
                                                className={`flex items-start justify-between p-4 border rounded-lg ${isActive ? 'border-primary/50 bg-primary/5' : ''}`}
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        {isActive && (
                                                            <span className="relative flex h-2 w-2">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                                                            </span>
                                                        )}
                                                        <p className="font-medium">
                                                            {isActive
                                                                ? 'In progress...'
                                                                : log.description}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                        {log.startTime && (
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="h-4 w-4" />
                                                                {log.startTime}
                                                                {log.endTime &&
                                                                    ` - ${log.endTime}`}
                                                            </div>
                                                        )}
                                                        {log.duration && (
                                                            <Badge variant="outline">
                                                                {log.duration}m
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {log.tags.length > 0 && (
                                                        <div className="flex items-center gap-1 mt-2">
                                                            <Tag className="h-4 w-4 text-muted-foreground" />
                                                            {log.tags.map(
                                                                (tag) => (
                                                                    <Badge
                                                                        key={
                                                                            tag
                                                                        }
                                                                        variant="secondary"
                                                                        className="text-xs"
                                                                    >
                                                                        {tag}
                                                                    </Badge>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleEdit(log)
                                                        }
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>

                                                    <AlertDialog>
                                                        <AlertDialogTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>
                                                                    Delete Work
                                                                    Log Entry
                                                                </AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure
                                                                    you want to
                                                                    delete this
                                                                    work log
                                                                    entry? This
                                                                    action
                                                                    cannot be
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
                                                                            log.id,
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
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {workLogs.length === 0 && (
                    <Card>
                        <CardContent className="py-12">
                            <div className="text-center">
                                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-medium">
                                    No work logs yet
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    Start tracking your work sessions by adding
                                    your first entry.
                                </p>
                                <Button onClick={() => setIsDialogOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Your First Entry
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
