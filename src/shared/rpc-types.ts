import type { RPCSchema } from 'electrobun/bun';

export interface WorkLogEntry {
    id: string;
    date: string;
    description: string;
    tags: string[];
    startTime?: string;
    endTime?: string;
    duration?: number;
    timestamp: number;
}

export interface Todo {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
    tags: string[];
    createdAt: number;
    updatedAt: number;
}

export interface Note {
    id: string;
    title: string;
    content: string;
    pinned: boolean;
    tags: string[];
    createdAt: number;
    updatedAt: number;
}

export interface Habit {
    id: string;
    name: string;
    description?: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    targetCount: number;
    color: string;
    icon: string;
    completedDates: string[];
    createdAt: number;
}

export interface PomodoroSession {
    id: string;
    date: string;
    startTime: string;
    endTime?: string;
    phase: 'focus' | 'short-break' | 'long-break';
    duration: number;
    completed: boolean;
}

export interface ActiveTimerState {
    isRunning: boolean;
    phase: 'focus' | 'short-break' | 'long-break';
    startedAt?: number;
    totalDuration: number;
    cycleCount: number;
}

export interface AppSettings {
    theme: 'light' | 'dark' | 'system';
    clockInPromptOnLaunch: boolean;
    pomodoro: {
        focusTime: number;
        shortBreakTime: number;
        longBreakTime: number;
        longBreakInterval: number;
        autoStartBreaks: boolean;
        autoStartPomodoros: boolean;
        soundEnabled: boolean;
    };
    notifications: {
        pomodoroComplete: boolean;
        breakComplete: boolean;
    };
}

export interface AppData {
    workLogs: WorkLogEntry[];
    todos: Todo[];
    notes: Note[];
    habits: Habit[];
    pomodoroSessions: PomodoroSession[];
    settings: AppSettings;
    activeTimer?: ActiveTimerState | null;
}

export type DevLogRPC = {
    bun: RPCSchema<{
        requests: {
            getAppData: { params: undefined; response: AppData };
            saveAppData: {
                params: { data: Partial<AppData> };
                response: boolean;
            };

            createWorkLog: {
                params: { entry: Omit<WorkLogEntry, 'id' | 'timestamp'> };
                response: { id: string };
            };
            updateWorkLog: {
                params: { id: string; updates: Partial<WorkLogEntry> };
                response: boolean;
            };
            deleteWorkLog: { params: { id: string }; response: boolean };

            createTodo: {
                params: { todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'> };
                response: { id: string };
            };
            updateTodo: {
                params: { id: string; updates: Partial<Todo> };
                response: boolean;
            };
            deleteTodo: { params: { id: string }; response: boolean };

            createNote: {
                params: { note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> };
                response: { id: string };
            };
            updateNote: {
                params: { id: string; updates: Partial<Note> };
                response: boolean;
            };
            deleteNote: { params: { id: string }; response: boolean };

            createHabit: {
                params: {
                    habit: {
                        name: string;
                        description?: string;
                        frequency?: 'daily' | 'weekly' | 'monthly';
                        targetCount?: number;
                        color?: string;
                        icon?: string;
                    };
                };
                response: { id: string };
            };
            updateHabit: {
                params: { id: string; updates: Partial<Habit> };
                response: boolean;
            };
            deleteHabit: { params: { id: string }; response: boolean };
            completeHabit: { params: { id: string }; response: boolean };

            createPomodoroSession: {
                params: { session: Omit<PomodoroSession, 'id'> };
                response: { id: string };
            };
            updatePomodoroSession: {
                params: { id: string; updates: Partial<PomodoroSession> };
                response: boolean;
            };

            getSettings: { params: undefined; response: AppSettings };
            updateSettings: {
                params: { settings: Partial<AppSettings> };
                response: boolean;
            };
        };
        messages: Record<string, never>;
    }>;
    webview: RPCSchema<{
        requests: Record<string, never>;
        messages: {
            playNotificationSound: undefined;
            updateTrayTimer: { timerState?: ActiveTimerState | null };
        };
    }>;
};
