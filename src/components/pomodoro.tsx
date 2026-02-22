import { useNavigate } from '@tanstack/react-router';
import { Pause, Play, RotateCcw, Settings } from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';
import type {
    ActiveTimerState,
    AppData,
    PomodoroSession,
} from '@/shared/rpc-types';

type TimerPhase = 'focus' | 'short-break' | 'long-break';

interface PomodoroState {
    timeLeft: number; // seconds
    isRunning: boolean;
    phase: TimerPhase;
    cycleCount: number;
    totalSessionsToday: number;
}

export function Pomodoro() {
    const [data, setData] = useState<AppData | null>(null);
    const navigate = useNavigate();
    const [timerState, setTimerState] = useState<PomodoroState>({
        timeLeft: 25 * 60, // 25 minutes in seconds
        isRunning: false,
        phase: 'focus',
        cycleCount: 0,
        totalSessionsToday: 0,
    });

    const loadData = useCallback(async () => {
        try {
            const appData = await api.getAppData();
            setData(appData);

            // Calculate today's sessions
            const today = new Date().toISOString().split('T')[0];
            const todaysSessions = appData.pomodoroSessions.filter(
                (session) => session.date === today && session.completed,
            );

            // Restore display state from active timer if it exists (never auto-start; user must click Start)
            if (
                appData?.activeTimer?.isRunning &&
                appData?.activeTimer?.startedAt
            ) {
                const now = Date.now();
                const elapsed = Math.floor(
                    (now - appData.activeTimer.startedAt) / 1000,
                );
                const remaining = Math.max(
                    0,
                    appData.activeTimer.totalDuration - elapsed,
                );

                setTimerState({
                    timeLeft: remaining,
                    isRunning: false,
                    phase: appData.activeTimer.phase,
                    cycleCount: appData.activeTimer.cycleCount,
                    totalSessionsToday: todaysSessions.length,
                });
                // Clear persisted running state so tray and DB match (user must click Start)
                api.saveAppData({ activeTimer: null }).catch(() => {});
            } else {
                setTimerState((prev) => ({
                    ...prev,
                    totalSessionsToday: todaysSessions.length,
                    timeLeft: appData.settings.pomodoro.focusTime * 60,
                }));
            }
        } catch (error) {
            console.error('Failed to load pomodoro data:', error);
        }
    }, []);

    const getPhaseDuration = useCallback(
        (phase: TimerPhase): number => {
            if (!data) return 25 * 60;

            switch (phase) {
                case 'focus':
                    return data.settings.pomodoro.focusTime * 60;
                case 'short-break':
                    return data.settings.pomodoro.shortBreakTime * 60;
                case 'long-break':
                    return data.settings.pomodoro.longBreakTime * 60;
                default:
                    return 25 * 60;
            }
        },
        [data],
    );

    const getPhaseLabel = useCallback((phase: TimerPhase): string => {
        switch (phase) {
            case 'focus':
                return 'Focus Time';
            case 'short-break':
                return 'Short Break';
            case 'long-break':
                return 'Long Break';
            default:
                return 'Focus Time';
        }
    }, []);

    const saveActiveTimer = useCallback(
        async (state: PomodoroState) => {
            if (!data) return;

            try {
                const activeTimer = state.isRunning
                    ? {
                          isRunning: true,
                          phase: state.phase,
                          startedAt:
                              Date.now() -
                              (getPhaseDuration(state.phase) - state.timeLeft) *
                                  1000,
                          totalDuration: getPhaseDuration(state.phase),
                          cycleCount: state.cycleCount,
                      }
                    : undefined;

                await api.saveAppData({ activeTimer });

                // Update tray timer display immediately with current state
                api.updateTrayTimer(activeTimer).catch((err) => {
                    console.warn('Failed to update tray timer:', err);
                });
            } catch (error) {
                console.error('Failed to save active timer:', error);
            }
        },
        [data, getPhaseDuration],
    );

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs
            .toString()
            .padStart(2, '0')}`;
    };

    const toggleTimer = async () => {
        if (timerState.isRunning) {
            // Pause timer
            const newState = { ...timerState, isRunning: false };
            setTimerState(newState);
            await saveActiveTimer(newState);
        } else {
            // Start timer (if timeLeft is 0, e.g. after restore from expired timer, use full duration)
            const timeLeft =
                timerState.timeLeft > 0
                    ? timerState.timeLeft
                    : getPhaseDuration(timerState.phase);
            const newState = {
                ...timerState,
                isRunning: true,
                timeLeft,
            };
            setTimerState(newState);
            await saveActiveTimer(newState);

            // Create session if starting focus time (full duration or recovered from 0)
            if (
                timerState.phase === 'focus' &&
                timeLeft === getPhaseDuration('focus')
            ) {
                try {
                    const session: Omit<PomodoroSession, 'id'> = {
                        date: new Date().toISOString().split('T')[0],
                        startTime: new Date().toTimeString().slice(0, 5),
                        phase: 'focus',
                        duration: data?.settings.pomodoro.focusTime || 25,
                        completed: false,
                    };
                    await api.createPomodoroSession(session);
                } catch (error) {
                    console.error('Failed to create pomodoro session:', error);
                }
            }
        }
    };

    const resetTimer = async () => {
        const newState = {
            ...timerState,
            isRunning: false,
            timeLeft: getPhaseDuration(timerState.phase),
        };
        setTimerState(newState);
        await saveActiveTimer(newState);
    };

    const nextPhase = useCallback(async () => {
        if (!data) return;

        const currentPhase = timerState.phase;
        let nextPhaseValue: TimerPhase;
        let newCycleCount = timerState.cycleCount;

        if (currentPhase === 'focus') {
            // Complete the focus session
            try {
                const today = new Date().toISOString().split('T')[0];
                const sessions = data.pomodoroSessions.filter(
                    (s) =>
                        s.date === today && s.phase === 'focus' && !s.completed,
                );
                if (sessions.length > 0) {
                    await api.updatePomodoroSession(sessions[0].id, {
                        completed: true,
                        endTime: new Date().toTimeString().slice(0, 5),
                    });
                }
            } catch (error) {
                console.error('Failed to complete pomodoro session:', error);
            }

            newCycleCount += 1;
            nextPhaseValue =
                newCycleCount % data.settings.pomodoro.longBreakInterval === 0
                    ? 'long-break'
                    : 'short-break';
        } else {
            nextPhaseValue = 'focus';
        }

        const newTimeLeft = getPhaseDuration(nextPhaseValue);
        const shouldAutoStart =
            (data.settings.pomodoro.autoStartPomodoros &&
                nextPhaseValue === 'focus') ||
            (data.settings.pomodoro.autoStartBreaks &&
                nextPhaseValue !== 'focus');

        const newState = {
            ...timerState,
            phase: nextPhaseValue,
            timeLeft: newTimeLeft,
            cycleCount: newCycleCount,
            totalSessionsToday:
                currentPhase === 'focus'
                    ? timerState.totalSessionsToday + 1
                    : timerState.totalSessionsToday,
            isRunning: shouldAutoStart,
        };

        setTimerState(newState);
        await saveActiveTimer(newState);
    }, [data, timerState, getPhaseDuration, saveActiveTimer]);

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (timerState.isRunning && timerState.timeLeft > 0) {
            interval = setInterval(() => {
                setTimerState((prev) => {
                    const newTimeLeft = prev.timeLeft - 1;

                    if (newTimeLeft <= 0) {
                        // Timer completed
                        if (data?.settings.pomodoro.soundEnabled) {
                            try {
                                api.playNotificationSound();
                            } catch (audioError) {
                                console.warn(
                                    'Could not initialize audio:',
                                    audioError,
                                );
                            }
                        }

                        // Show notification
                        if (
                            'Notification' in window &&
                            Notification.permission === 'granted'
                        ) {
                            try {
                                new Notification(
                                    `${getPhaseLabel(prev.phase)} Complete!`,
                                    {
                                        body: 'Time for a break!',
                                        icon: '/icon.png',
                                    },
                                );
                            } catch (notificationError) {
                                console.warn(
                                    'Could not show notification:',
                                    notificationError,
                                );
                            }
                        }

                        // Auto-advance to next phase
                        setTimeout(() => nextPhase(), 1000);
                        return { ...prev, timeLeft: 0, isRunning: false };
                    }

                    return { ...prev, timeLeft: newTimeLeft };
                });
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [
        timerState.isRunning,
        timerState.timeLeft,
        data?.settings.pomodoro,
        getPhaseLabel,
        nextPhase,
    ]);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Update tray whenever timer state changes
    useEffect(() => {
        if (!data) return;

        // Pass null when stopped to prevent reading stale data from disk
        const activeTimer: ActiveTimerState | null = timerState.isRunning
            ? {
                  isRunning: true,
                  phase: timerState.phase,
                  startedAt:
                      Date.now() -
                      (getPhaseDuration(timerState.phase) -
                          timerState.timeLeft) *
                          1000,
                  totalDuration: getPhaseDuration(timerState.phase),
                  cycleCount: timerState.cycleCount,
              }
            : null;

        api.updateTrayTimer(activeTimer).catch((err) => {
            console.warn('Failed to update tray timer:', err);
        });
    }, [
        data,
        timerState.timeLeft,
        timerState.isRunning,
        timerState.phase,
        timerState.cycleCount,
        getPhaseDuration,
    ]);

    // Request notification permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().catch((err) => {
                console.warn('Could not request notification permission:', err);
            });
        }
    }, []);

    // Save timer state when navigating away or component unmounts
    useEffect(() => {
        return () => {
            // Save current timer state on unmount
            if (data && timerState.isRunning) {
                const activeTimer = {
                    isRunning: true,
                    phase: timerState.phase,
                    startedAt:
                        Date.now() -
                        (getPhaseDuration(timerState.phase) -
                            timerState.timeLeft) *
                            1000,
                    totalDuration: getPhaseDuration(timerState.phase),
                    cycleCount: timerState.cycleCount,
                };
                api.saveAppData({ activeTimer }).catch((err) => {
                    console.error('Failed to save timer on unmount:', err);
                });
                // Update tray with current state
                api.updateTrayTimer(activeTimer).catch((err) => {
                    console.warn(
                        'Failed to update tray timer on unmount:',
                        err,
                    );
                });
            }
        };
    }, [data, timerState, getPhaseDuration]);

    if (!data) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-48"></div>
                    <div className="h-64 bg-muted rounded"></div>
                </div>
            </div>
        );
    }

    const totalDuration = getPhaseDuration(timerState.phase);
    const progress =
        ((totalDuration - timerState.timeLeft) / totalDuration) * 100;

    // Show loading state if data hasn't loaded yet
    if (!data) {
        return (
            <div className="p-6 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Pomodoro Timer</h1>
                    <p className="text-muted-foreground">
                        Stay focused and productive with timed work sessions.
                    </p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Timer Widget Skeleton */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <div className="animate-pulse">
                                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="text-center">
                                    <div className="animate-pulse">
                                        <div className="h-16 bg-gray-200 rounded w-32 mx-auto mb-4"></div>
                                        <div className="h-2 bg-gray-200 rounded w-full"></div>
                                    </div>
                                </div>
                                <div className="flex justify-center gap-4">
                                    <div className="animate-pulse h-10 bg-gray-200 rounded w-20"></div>
                                    <div className="animate-pulse h-10 bg-gray-200 rounded w-20"></div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    {/* Settings Widget Skeleton */}
                    <div>
                        <Card>
                            <CardHeader>
                                <div className="animate-pulse">
                                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="animate-pulse space-y-2">
                                    <div className="h-4 bg-gray-200 rounded"></div>
                                    <div className="h-4 bg-gray-200 rounded"></div>
                                    <div className="h-4 bg-gray-200 rounded"></div>
                                    <div className="h-4 bg-gray-200 rounded"></div>
                                </div>
                                <div className="animate-pulse h-8 bg-gray-200 rounded w-full mt-4"></div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Pomodoro Timer</h1>
                <p className="text-muted-foreground">
                    Stay focused and productive with timed work sessions.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Timer Widget */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Badge
                                    variant={
                                        timerState.phase === 'focus'
                                            ? 'default'
                                            : 'secondary'
                                    }
                                >
                                    {getPhaseLabel(timerState.phase)}
                                </Badge>
                                <span>Cycle {timerState.cycleCount + 1}</span>
                            </CardTitle>
                            <CardDescription>
                                {timerState.phase === 'focus'
                                    ? 'Time to focus on your work'
                                    : 'Take a break and recharge'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Timer Display */}
                            <div className="text-center">
                                <div className="text-6xl font-mono font-bold mb-4">
                                    {formatTime(timerState.timeLeft)}
                                </div>
                                <Progress
                                    value={progress}
                                    className="w-full h-2"
                                />

                                {/* Cycle Indicator Dots */}
                                <div className="flex flex-col items-center gap-1 mt-4">
                                    <div className="flex justify-center gap-2">
                                        {Array.from({
                                            length: data.settings.pomodoro
                                                .longBreakInterval,
                                        }).map((_, index) => (
                                            <div
                                                key={`cycle-indicator-${data.settings.pomodoro.longBreakInterval}-${index}`}
                                                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                                    index <
                                                    (
                                                        timerState.cycleCount %
                                                            data.settings
                                                                .pomodoro
                                                                .longBreakInterval
                                                    )
                                                        ? 'bg-primary scale-110'
                                                        : 'bg-muted'
                                                }`}
                                                title={`Cycle ${index + 1}`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-xs text-muted-foreground mt-1">
                                        {(timerState.cycleCount %
                                            data.settings.pomodoro
                                                .longBreakInterval) +
                                            (timerState.phase === 'focus'
                                                ? 1
                                                : 0)}{' '}
                                        /{' '}
                                        {
                                            data.settings.pomodoro
                                                .longBreakInterval
                                        }{' '}
                                        until long break
                                    </span>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex justify-center gap-4">
                                <Button
                                    onClick={toggleTimer}
                                    size="lg"
                                    className="px-8"
                                >
                                    {timerState.isRunning ? (
                                        <>
                                            <Pause className="h-4 w-4 mr-2" />
                                            Pause
                                        </>
                                    ) : (
                                        <>
                                            <Play className="h-4 w-4 mr-2" />
                                            Start
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={resetTimer}
                                    variant="outline"
                                    size="lg"
                                >
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Reset
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Stats Sidebar */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Today's Sessions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {timerState.totalSessionsToday}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                completed sessions
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span>Focus:</span>
                                <span>{data.settings.pomodoro.focusTime}m</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Short Break:</span>
                                <span>
                                    {data.settings.pomodoro.shortBreakTime}m
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Long Break:</span>
                                <span>
                                    {data.settings.pomodoro.longBreakTime}m
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Long Break Every:</span>
                                <span>
                                    {data.settings.pomodoro.longBreakInterval}{' '}
                                    cycles
                                </span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full mt-4"
                                onClick={() => navigate({ to: '/settings' })}
                            >
                                <Settings className="h-4 w-4 mr-2" />
                                Configure
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
