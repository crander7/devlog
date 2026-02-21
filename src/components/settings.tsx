import { Monitor, Moon, Save, Sun } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTheme } from '@/components/theme-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { AppData, AppSettings } from '@/types/electron';

export function Settings() {
    const [data, setData] = useState<AppData | null>(null);
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const { theme, setTheme } = useTheme();

    const loadData = useCallback(async () => {
        try {
            const appData = await window.electronAPI.getAppData();
            setData(appData);
            setSettings(appData.settings);
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const updateSettings = (updates: Partial<AppSettings>) => {
        if (!settings) return;
        setSettings({ ...settings, ...updates });
        setHasChanges(true);
    };

    const updatePomodoroSettings = (
        updates: Partial<AppSettings['pomodoro']>,
    ) => {
        if (!settings) return;
        setSettings({
            ...settings,
            pomodoro: { ...settings.pomodoro, ...updates },
        });
        setHasChanges(true);
    };

    const updateNotificationSettings = (
        updates: Partial<AppSettings['notifications']>,
    ) => {
        if (!settings) return;
        setSettings({
            ...settings,
            notifications: { ...settings.notifications, ...updates },
        });
        setHasChanges(true);
    };

    const saveSettings = async () => {
        if (!settings) return;
        try {
            await window.electronAPI.updateSettings(settings);
            await loadData();
            setHasChanges(false);
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    };

    const resetToDefaults = () => {
        const defaultSettings: AppSettings = {
            theme: 'system',
            pomodoro: {
                focusTime: 25,
                shortBreakTime: 5,
                longBreakTime: 15,
                longBreakInterval: 4,
                autoStartBreaks: false,
                autoStartPomodoros: false,
                soundEnabled: true,
            },
            notifications: {
                pomodoroComplete: true,
                breakComplete: true,
            },
        };
        setSettings(defaultSettings);
        setHasChanges(true);
    };

    if (!settings || !data) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-48"></div>
                    <div className="space-y-4">
                        {[...Array(4)].map((_, index) => (
                            <div
                                key={`loading-setting-${index.toString()}-${Math.random()}`}
                                className="h-24 bg-muted rounded"
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Settings</h1>
                    <p className="text-muted-foreground">
                        Customize your productivity experience.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={resetToDefaults}>
                        Reset to Defaults
                    </Button>
                    <Button onClick={saveSettings} disabled={!hasChanges}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* Appearance */}
            <Card>
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>
                        Customize the look and feel of the application.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label className="text-sm font-medium">Theme</Label>
                        <div className="flex gap-2 mt-2">
                            <Button
                                variant={
                                    theme === 'light' ? 'default' : 'outline'
                                }
                                size="sm"
                                onClick={() => {
                                    setTheme('light');
                                    updateSettings({ theme: 'light' });
                                }}
                            >
                                <Sun className="h-4 w-4 mr-2" />
                                Light
                            </Button>
                            <Button
                                variant={
                                    theme === 'dark' ? 'default' : 'outline'
                                }
                                size="sm"
                                onClick={() => {
                                    setTheme('dark');
                                    updateSettings({ theme: 'dark' });
                                }}
                            >
                                <Moon className="h-4 w-4 mr-2" />
                                Dark
                            </Button>
                            <Button
                                variant={
                                    theme === 'system' ? 'default' : 'outline'
                                }
                                size="sm"
                                onClick={() => {
                                    setTheme('system');
                                    updateSettings({ theme: 'system' });
                                }}
                            >
                                <Monitor className="h-4 w-4 mr-2" />
                                System
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Pomodoro Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Pomodoro Timer</CardTitle>
                    <CardDescription>
                        Configure your focus and break intervals.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label
                                htmlFor="focus-time"
                                className="text-sm font-medium"
                            >
                                Focus Time (minutes)
                            </Label>
                            <Input
                                id="focus-time"
                                type="number"
                                min="1"
                                max="60"
                                value={settings.pomodoro.focusTime}
                                onChange={(e) =>
                                    updatePomodoroSettings({
                                        focusTime:
                                            parseInt(e.target.value, 10) || 25,
                                    })
                                }
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label
                                htmlFor="short-break"
                                className="text-sm font-medium"
                            >
                                Short Break (minutes)
                            </Label>
                            <Input
                                id="short-break"
                                type="number"
                                min="1"
                                max="30"
                                value={settings.pomodoro.shortBreakTime}
                                onChange={(e) =>
                                    updatePomodoroSettings({
                                        shortBreakTime:
                                            parseInt(e.target.value, 10) || 5,
                                    })
                                }
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label
                                htmlFor="long-break"
                                className="text-sm font-medium"
                            >
                                Long Break (minutes)
                            </Label>
                            <Input
                                id="long-break"
                                type="number"
                                min="1"
                                max="60"
                                value={settings.pomodoro.longBreakTime}
                                onChange={(e) =>
                                    updatePomodoroSettings({
                                        longBreakTime:
                                            parseInt(e.target.value, 10) || 15,
                                    })
                                }
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label
                                htmlFor="long-break-interval"
                                className="text-sm font-medium"
                            >
                                Long Break Every (cycles)
                            </Label>
                            <Input
                                id="long-break-interval"
                                type="number"
                                min="1"
                                max="10"
                                value={settings.pomodoro.longBreakInterval}
                                onChange={(e) =>
                                    updatePomodoroSettings({
                                        longBreakInterval:
                                            parseInt(e.target.value, 10) || 4,
                                    })
                                }
                                className="mt-1"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-sm font-medium">
                                    Auto-start Breaks
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Automatically start break timers when focus
                                    sessions end
                                </p>
                            </div>
                            <Switch
                                checked={settings.pomodoro.autoStartBreaks}
                                onCheckedChange={(checked: boolean) =>
                                    updatePomodoroSettings({
                                        autoStartBreaks: checked,
                                    })
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-sm font-medium">
                                    Auto-start Pomodoros
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Automatically start focus timers when breaks
                                    end
                                </p>
                            </div>
                            <Switch
                                checked={settings.pomodoro.autoStartPomodoros}
                                onCheckedChange={(checked: boolean) =>
                                    updatePomodoroSettings({
                                        autoStartPomodoros: checked,
                                    })
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-sm font-medium">
                                    Sound Notifications
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Play sounds when timers complete
                                </p>
                            </div>
                            <Switch
                                checked={settings.pomodoro.soundEnabled}
                                onCheckedChange={(checked: boolean) =>
                                    updatePomodoroSettings({
                                        soundEnabled: checked,
                                    })
                                }
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>
                        Control when and how you receive notifications.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-sm font-medium">
                                Pomodoro Complete
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Notify when focus sessions end
                            </p>
                        </div>
                        <Switch
                            checked={settings.notifications.pomodoroComplete}
                            onCheckedChange={(checked: boolean) =>
                                updateNotificationSettings({
                                    pomodoroComplete: checked,
                                })
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-sm font-medium">
                                Break Complete
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Notify when break sessions end
                            </p>
                        </div>
                        <Switch
                            checked={settings.notifications.breakComplete}
                            onCheckedChange={(checked: boolean) =>
                                updateNotificationSettings({
                                    breakComplete: checked,
                                })
                            }
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Data Management */}
            <Card>
                <CardHeader>
                    <CardTitle>Data Management</CardTitle>
                    <CardDescription>
                        Manage your application data and export options.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <Button variant="outline">Export Data</Button>
                        <Button variant="outline">Import Data</Button>
                        <Button variant="destructive">Clear All Data</Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                        Export your data as JSON or import from a backup file.
                    </p>
                </CardContent>
            </Card>

            {/* App Info */}
            <Card>
                <CardHeader>
                    <CardTitle>About DevLog</CardTitle>
                    <CardDescription>
                        Application information and version details.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm font-medium">
                                Version:
                            </span>
                            <Badge variant="secondary">1.0.0</Badge>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm font-medium">
                                Work Logs:
                            </span>
                            <Badge variant="secondary">
                                {data.workLogs.length}
                            </Badge>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm font-medium">Todos:</span>
                            <Badge variant="secondary">
                                {data.todos.length}
                            </Badge>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm font-medium">Notes:</span>
                            <Badge variant="secondary">
                                {data.notes.length}
                            </Badge>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm font-medium">Habits:</span>
                            <Badge variant="secondary">
                                {data.habits.length}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
