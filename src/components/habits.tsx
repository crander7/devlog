import { Check, Flame, Plus, Target, Trash2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import {
    getHabitLongestStreak,
    getHabitStreak,
    isHabitCompletedToday,
} from '@/lib/utils';
import type { AppData, Habit } from '@/shared/rpc-types';

interface HabitFormData {
    name: string;
    description: string;
}

export function Habits() {
    const [data, setData] = useState<AppData | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState<HabitFormData>({
        name: '',
        description: '',
    });

    const loadData = useCallback(async () => {
        try {
            const appData = await api.getAppData();
            setData(appData);
        } catch (error) {
            console.error('Failed to load habits:', error);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
        });
    };

    const openCreateDialog = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        resetForm();
    };

    const handleSubmit = async () => {
        try {
            await api.createHabit({
                name: formData.name,
                description: formData.description,
            });
            await loadData();
            closeDialog();
        } catch (error) {
            console.error('Failed to create habit:', error);
        }
    };

    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    const confirmDelete = async () => {
        if (!pendingDeleteId) return;
        try {
            await api.deleteHabit(pendingDeleteId);
            await loadData();
        } catch (error) {
            console.error('Failed to delete habit:', error);
        } finally {
            setPendingDeleteId(null);
        }
    };

    const completeHabit = async (habit: Habit) => {
        try {
            await api.completeHabit(habit.id);
            await loadData();
        } catch (error) {
            console.error('Failed to complete habit:', error);
        }
    };

    const getStreakColor = (streak: number): string => {
        if (streak === 0) return 'text-muted-foreground';
        if (streak < 3) return 'text-orange-500';
        if (streak < 7) return 'text-yellow-500';
        if (streak < 14) return 'text-green-500';
        if (streak < 30) return 'text-blue-500';
        return 'text-purple-500';
    };

    const getStreakLabel = (streak: number): string => {
        if (streak === 0) return 'No streak';
        if (streak === 1) return '1 day';
        return `${streak} days`;
    };

    if (!data) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-48"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...Array(4)].map((_, index) => (
                            <div
                                key={`loading-habit-${index.toString()}`}
                                className="h-24 bg-muted rounded"
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const todaysCompletedHabits = data.habits.filter((habit) =>
        isHabitCompletedToday(habit.completedDates),
    ).length;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Habits</h1>
                    <p className="text-muted-foreground">
                        Build consistent habits and track your progress.
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreateDialog}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Habit
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Habit</DialogTitle>
                            <DialogDescription>
                                Add a new habit to track daily.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div>
                                <label
                                    htmlFor="habit-name"
                                    className="text-sm font-medium"
                                >
                                    Name
                                </label>
                                <Input
                                    id="habit-name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g., Drink water, Exercise"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="habit-description"
                                    className="text-sm font-medium"
                                >
                                    Description (Optional)
                                </label>
                                <Textarea
                                    id="habit-description"
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                    placeholder="Describe your habit..."
                                    rows={3}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={closeDialog}>
                                Cancel
                            </Button>
                            <Button onClick={handleSubmit}>Create Habit</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Today's Progress */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Today's Progress
                    </CardTitle>
                    <CardDescription>
                        {todaysCompletedHabits} of {data.habits.length} habits
                        completed
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="w-full bg-muted rounded-full h-2">
                        <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{
                                width:
                                    data.habits.length > 0
                                        ? `${(todaysCompletedHabits / data.habits.length) * 100}%`
                                        : '0%',
                            }}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Habits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.habits.map((habit) => {
                    const completedToday = isHabitCompletedToday(
                        habit.completedDates,
                    );
                    const streak = getHabitStreak(habit.completedDates);
                    const longestStreak = getHabitLongestStreak(
                        habit.completedDates,
                    );

                    return (
                        <Card
                            key={habit.id}
                            className={
                                completedToday ? 'ring-2 ring-green-500' : ''
                            }
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">
                                            {habit.name}
                                        </CardTitle>
                                        {habit.description && (
                                            <CardDescription className="mt-1">
                                                {habit.description}
                                            </CardDescription>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            setPendingDeleteId(habit.id)
                                        }
                                        className="text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {/* Streak Display */}
                                    <div className="flex items-center gap-2">
                                        <Flame
                                            className={`h-4 w-4 ${getStreakColor(streak)}`}
                                        />
                                        <span
                                            className={`text-sm font-medium ${getStreakColor(streak)}`}
                                        >
                                            {getStreakLabel(streak)}
                                        </span>
                                        {longestStreak > streak && (
                                            <Badge
                                                variant="outline"
                                                className="text-xs"
                                            >
                                                Best: {longestStreak}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Completion Status */}
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-muted-foreground">
                                            {completedToday ? (
                                                <span className="text-green-600 font-medium">
                                                    ✓ Completed today
                                                </span>
                                            ) : streak === 0 ? (
                                                <span className="text-orange-600">
                                                    No active streak
                                                </span>
                                            ) : (
                                                <span>Not completed today</span>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => completeHabit(habit)}
                                            disabled={completedToday}
                                            variant={
                                                completedToday
                                                    ? 'secondary'
                                                    : 'default'
                                            }
                                        >
                                            {completedToday ? (
                                                <Check className="h-4 w-4" />
                                            ) : (
                                                'Complete'
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {data.habits.length === 0 && (
                <div className="text-center py-12">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <div className="text-muted-foreground mb-4">
                        No habits yet. Start building consistent routines!
                    </div>
                    <Button onClick={openCreateDialog}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create your first habit
                    </Button>
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
                        <AlertDialogTitle>Delete habit</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this habit? This
                            will reset all your progress and cannot be undone.
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
