import { Check, Flame, Plus, Target, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
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
import type { AppData, Habit } from '@/types/electron';

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
            const appData = await window.electronAPI.getAppData();
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
            await window.electronAPI.createHabit({
                name: formData.name,
                description: formData.description,
            });
            await loadData();
            closeDialog();
        } catch (error) {
            console.error('Failed to create habit:', error);
        }
    };

    const handleDelete = async (habitId: string) => {
        if (
            confirm(
                'Are you sure you want to delete this habit? This will reset all your progress.',
            )
        ) {
            try {
                await window.electronAPI.deleteHabit(habitId);
                await loadData();
            } catch (error) {
                console.error('Failed to delete habit:', error);
            }
        }
    };

    const completeHabit = async (habit: Habit) => {
        try {
            await window.electronAPI.completeHabit(habit.id);
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
                                key={`loading-habit-${index.toString()}-${Math.random()}`}
                                className="h-24 bg-muted rounded"
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const today = new Date().toISOString().split('T')[0];
    const todaysCompletedHabits = data.habits.filter(
        (habit) => habit.lastCompleted === today,
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
                    const isCompletedToday = habit.lastCompleted === today;
                    const isStreakBroken =
                        habit.lastCompleted && habit.lastCompleted !== today;

                    return (
                        <Card
                            key={habit.id}
                            className={
                                isCompletedToday ? 'ring-2 ring-green-500' : ''
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
                                        onClick={() => handleDelete(habit.id)}
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
                                            className={`h-4 w-4 ${getStreakColor(habit.streak)}`}
                                        />
                                        <span
                                            className={`text-sm font-medium ${getStreakColor(habit.streak)}`}
                                        >
                                            {getStreakLabel(habit.streak)}
                                        </span>
                                        {habit.longestStreak > habit.streak && (
                                            <Badge
                                                variant="outline"
                                                className="text-xs"
                                            >
                                                Best: {habit.longestStreak}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Completion Status */}
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-muted-foreground">
                                            {isCompletedToday ? (
                                                <span className="text-green-600 font-medium">
                                                    ✓ Completed today
                                                </span>
                                            ) : isStreakBroken ? (
                                                <span className="text-orange-600">
                                                    Streak broken yesterday
                                                </span>
                                            ) : (
                                                <span>Not completed today</span>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => completeHabit(habit)}
                                            disabled={isCompletedToday}
                                            variant={
                                                isCompletedToday
                                                    ? 'secondary'
                                                    : 'default'
                                            }
                                        >
                                            {isCompletedToday ? (
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
        </div>
    );
}
