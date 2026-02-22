import { eachDayOfInterval, endOfWeek, format, startOfWeek } from 'date-fns';
import {
    BarChart3,
    Calendar,
    Clock,
    Target,
    Timer,
    TrendingUp,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';
import { getHabitLongestStreak, getHabitStreak } from '@/lib/utils';
import type { AppData } from '@/shared/rpc-types';

export function Stats() {
    const [data, setData] = useState<AppData | null>(null);

    const loadData = useCallback(async () => {
        try {
            const appData = await api.getAppData();
            setData(appData);
        } catch (error) {
            console.error('Failed to load stats data:', error);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (!data) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-48"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, index) => (
                            <div
                                key={`loading-stat-${index.toString()}`}
                                className="h-32 bg-muted rounded"
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const today = new Date();
    const thisWeek = eachDayOfInterval({
        start: startOfWeek(today, { weekStartsOn: 1 }), // Monday
        end: endOfWeek(today, { weekStartsOn: 1 }),
    });

    // Calculate weekly stats
    const weeklyWorkLogs = data.workLogs.filter((log) => {
        const logDate = new Date(log.timestamp);
        return logDate >= thisWeek[0] && logDate <= thisWeek[6];
    });

    const weeklyTodos = data.todos.filter((todo) => {
        if (!todo.createdAt) return false;
        const todoDate = new Date(todo.createdAt);
        return todoDate >= thisWeek[0] && todoDate <= thisWeek[6];
    });

    const weeklyPomodoroSessions = data.pomodoroSessions.filter((session) => {
        const sessionDate = new Date(session.date);
        return (
            sessionDate >= thisWeek[0] &&
            sessionDate <= thisWeek[6] &&
            session.completed
        );
    });

    // Calculate totals
    const totalWorkMinutes = weeklyWorkLogs.reduce(
        (sum, log) => sum + (log.duration || 0),
        0,
    );
    const completedTodos = weeklyTodos.filter((todo) => todo.completed).length;
    const totalTodos = weeklyTodos.length;
    const completedSessions = weeklyPomodoroSessions.length;

    // Calculate daily breakdown for this week
    const dailyStats = thisWeek.map((day) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayWorkLogs = data.workLogs.filter((log) => log.date === dayStr);
        const dayTodos = data.todos.filter(
            (todo) =>
                todo.dueDate === dayStr || (!todo.dueDate && !todo.completed),
        );
        const daySessions = data.pomodoroSessions.filter(
            (session) => session.date === dayStr && session.completed,
        );

        return {
            date: day,
            workMinutes: dayWorkLogs.reduce(
                (sum, log) => sum + (log.duration || 0),
                0,
            ),
            todosCompleted: dayTodos.filter((todo) => todo.completed).length,
            totalTodos: dayTodos.length,
            pomodoroSessions: daySessions.length,
        };
    });

    const averageDailyWork = totalWorkMinutes / 7;
    const weeklyCompletionRate =
        totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Statistics</h1>
                <p className="text-muted-foreground">
                    Track your productivity and see how you're progressing.
                </p>
            </div>

            {/* Weekly Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Work Hours
                        </CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Math.floor(totalWorkMinutes / 60)}h{' '}
                            {totalWorkMinutes % 60}m
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {Math.floor(averageDailyWork / 60)}h{' '}
                            {Math.floor(averageDailyWork % 60)}m daily average
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Task Completion
                        </CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {completedTodos}/{totalTodos}
                        </div>
                        <Progress
                            value={weeklyCompletionRate}
                            className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            {Math.round(weeklyCompletionRate)}% completion rate
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
                        <div className="text-2xl font-bold">
                            {completedSessions}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {Math.round((completedSessions / 7) * 10) / 10} per
                            day average
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Habits
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {
                                data.habits.filter(
                                    (h) => getHabitStreak(h.completedDates) > 0,
                                ).length
                            }
                        </div>
                        <p className="text-xs text-muted-foreground">
                            active streaks
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Daily Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        This Week's Activity
                    </CardTitle>
                    <CardDescription>
                        Daily breakdown of your productivity metrics
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {dailyStats.map((day) => (
                            <div
                                key={day.date.toISOString()}
                                className="flex items-center justify-between p-3 border rounded-lg"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-20 text-sm font-medium">
                                        {format(day.date, 'EEE')}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {format(day.date, 'MMM d')}
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 text-sm">
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>
                                            {Math.floor(day.workMinutes / 60)}h{' '}
                                            {day.workMinutes % 60}m
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Target className="h-3 w-3" />
                                        <span>
                                            {day.todosCompleted}/
                                            {day.totalTodos}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Timer className="h-3 w-3" />
                                        <span>{day.pomodoroSessions}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Habit Performance */}
            {data.habits.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Habit Performance
                        </CardTitle>
                        <CardDescription>
                            Track your habit streaks and consistency
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.habits.map((habit) => {
                                const streak = getHabitStreak(
                                    habit.completedDates,
                                );
                                const longestStreak = getHabitLongestStreak(
                                    habit.completedDates,
                                );
                                return (
                                    <div
                                        key={habit.id}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                    >
                                        <div>
                                            <div className="font-medium">
                                                {habit.name}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Current streak: {streak} days
                                                {longestStreak > streak && (
                                                    <span>
                                                        {' '}
                                                        • Best: {longestStreak}{' '}
                                                        days
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant={
                                                    streak > 0
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {streak > 0
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </Badge>
                                            <div className="w-24">
                                                <Progress
                                                    value={Math.min(
                                                        (streak / 30) * 100,
                                                        100,
                                                    )}
                                                    className="h-2"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
