export interface WorkLogEntry {
    id: string;
    date: string; // YYYY-MM-DD
    description: string;
    tags: string[];
    startTime?: string; // HH:mm
    endTime?: string; // HH:mm
    duration?: number; // minutes
    timestamp: number;
}

export interface Todo {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    priority: 'low' | 'medium' | 'high';
    dueDate?: string; // YYYY-MM-DD
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
    streak: number;
    longestStreak: number;
    lastCompleted?: string; // YYYY-MM-DD
    createdAt: number;
    updatedAt: number;
}

export interface PomodoroSession {
    id: string;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
    endTime?: string; // HH:mm
    phase: 'focus' | 'short-break' | 'long-break';
    duration: number; // minutes
    completed: boolean;
}

export interface ActiveTimerState {
    isRunning: boolean;
    phase: 'focus' | 'short-break' | 'long-break';
    startedAt?: number; // timestamp when timer started
    totalDuration: number; // total seconds for this phase
    cycleCount: number;
}

export interface AppSettings {
    theme: 'light' | 'dark' | 'system';
    pomodoro: {
        focusTime: number; // minutes
        shortBreakTime: number; // minutes
        longBreakTime: number; // minutes
        longBreakInterval: number; // cycles before long break
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
    activeTimer?: ActiveTimerState;
}

declare global {
    interface Window {
        electronAPI: {
            // Work Log
            getLastEntry: () => Promise<WorkLogEntry | null>;
            clockOut: (
                workDescription: string,
            ) => Promise<{ success: boolean }>;
            clockIn: () => Promise<{
                success: boolean;
                lastWorkDescription: string | null;
            }>;
            getAllEntries: () => Promise<WorkLogEntry[]>;

            // Data management
            getAppData: () => Promise<AppData>;
            saveAppData: (data: Partial<AppData>) => Promise<boolean>;

            // Work Logs
            createWorkLog: (
                entry: Omit<WorkLogEntry, 'id' | 'timestamp'>,
            ) => Promise<WorkLogEntry>;
            updateWorkLog: (
                id: string,
                updates: Partial<WorkLogEntry>,
            ) => Promise<boolean>;
            deleteWorkLog: (id: string) => Promise<boolean>;

            // Todos
            createTodo: (
                todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>,
            ) => Promise<Todo>;
            updateTodo: (
                id: string,
                updates: Partial<Todo>,
            ) => Promise<boolean>;
            deleteTodo: (id: string) => Promise<boolean>;

            // Notes
            createNote: (
                note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>,
            ) => Promise<Note>;
            updateNote: (
                id: string,
                updates: Partial<Note>,
            ) => Promise<boolean>;
            deleteNote: (id: string) => Promise<boolean>;

            // Habits
            createHabit: (
                habit: Omit<
                    Habit,
                    | 'id'
                    | 'streak'
                    | 'longestStreak'
                    | 'createdAt'
                    | 'updatedAt'
                >,
            ) => Promise<Habit>;
            updateHabit: (
                id: string,
                updates: Partial<Habit>,
            ) => Promise<boolean>;
            deleteHabit: (id: string) => Promise<boolean>;
            completeHabit: (id: string) => Promise<boolean>;

            // Pomodoro
            createPomodoroSession: (
                session: Omit<PomodoroSession, 'id'>,
            ) => Promise<PomodoroSession>;
            updatePomodoroSession: (
                id: string,
                updates: Partial<PomodoroSession>,
            ) => Promise<boolean>;

            // Settings
            getSettings: () => Promise<AppSettings>;
            updateSettings: (
                settings: Partial<AppSettings>,
            ) => Promise<boolean>;

            // Tray and notifications
            playNotificationSound: () => Promise<void>;
            updateTrayTimer: (
                timerState?: ActiveTimerState | null,
            ) => Promise<void>;
        };
    }
}
