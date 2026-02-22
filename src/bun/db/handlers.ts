import { eq } from 'drizzle-orm';
import { db, sqlite } from './index';
import * as schema from './schema';

const parseJsonArray = <T>(json: string): T[] => {
    try {
        return JSON.parse(json);
    } catch {
        return [];
    }
};

const stringifyArray = (arr: unknown[]): string => JSON.stringify(arr);

// Work Logs
export function getAllWorkLogs() {
    const logs = db.select().from(schema.workLogs).all();
    return logs.map((log) => ({
        id: log.id,
        date: log.date,
        description: log.description,
        tags: parseJsonArray<string>(log.tags),
        startTime: log.startTime ?? undefined,
        endTime: log.endTime ?? undefined,
        duration: log.duration ?? undefined,
        timestamp: log.createdAt,
    }));
}

export function createWorkLog(data: {
    date: string;
    description: string;
    tags: string[];
    startTime?: string;
    endTime?: string;
}) {
    const id = crypto.randomUUID();
    const now = Date.now();

    let duration: number | undefined;
    if (data.startTime && data.endTime) {
        const start = new Date(`${data.date}T${data.startTime}`);
        const end = new Date(`${data.date}T${data.endTime}`);
        duration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
    }

    db.insert(schema.workLogs)
        .values({
            id,
            date: data.date,
            description: data.description,
            tags: stringifyArray(data.tags),
            startTime: data.startTime ?? null,
            endTime: data.endTime ?? null,
            duration: duration ?? null,
            createdAt: now,
        })
        .run();

    return { id };
}

export function updateWorkLog(
    id: string,
    data: Partial<{
        description: string;
        tags: string[];
        startTime: string;
        endTime: string;
    }>,
) {
    const updates: Record<string, unknown> = {};

    if (data.description !== undefined) updates.description = data.description;
    if (data.tags !== undefined) updates.tags = stringifyArray(data.tags);
    if (data.startTime !== undefined) updates.startTime = data.startTime;
    if (data.endTime !== undefined) updates.endTime = data.endTime;

    if (data.startTime || data.endTime) {
        const log = db
            .select()
            .from(schema.workLogs)
            .where(eq(schema.workLogs.id, id))
            .get();
        if (log) {
            const startTimeStr = data.startTime ?? log.startTime;
            const endTimeStr = data.endTime ?? log.endTime;
            if (startTimeStr && endTimeStr) {
                const start = new Date(`${log.date}T${startTimeStr}`);
                const end = new Date(`${log.date}T${endTimeStr}`);
                updates.duration = Math.floor(
                    (end.getTime() - start.getTime()) / (1000 * 60),
                );
            }
        }
    }

    db.update(schema.workLogs)
        .set(updates)
        .where(eq(schema.workLogs.id, id))
        .run();
}

export function deleteWorkLog(id: string) {
    db.delete(schema.workLogs).where(eq(schema.workLogs.id, id)).run();
}

// Todos
export function getAllTodos() {
    const todos = db.select().from(schema.todos).all();
    return todos.map((todo) => ({
        id: todo.id,
        title: todo.title,
        description: todo.description ?? undefined,
        completed: todo.completed,
        priority: todo.priority as 'low' | 'medium' | 'high',
        dueDate: todo.dueDate ?? undefined,
        tags: parseJsonArray<string>(todo.tags),
        createdAt: todo.createdAt,
        updatedAt: todo.createdAt,
    }));
}

export function createTodo(data: {
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
    tags: string[];
    completed: boolean;
}) {
    const id = crypto.randomUUID();
    const now = Date.now();

    db.insert(schema.todos)
        .values({
            id,
            title: data.title,
            description: data.description ?? null,
            completed: data.completed,
            priority: data.priority,
            dueDate: data.dueDate ?? null,
            tags: stringifyArray(data.tags),
            createdAt: now,
        })
        .run();

    return { id };
}

export function updateTodo(
    id: string,
    data: Partial<{
        title: string;
        description: string;
        completed: boolean;
        priority: 'low' | 'medium' | 'high';
        dueDate: string;
        tags: string[];
    }>,
) {
    const updates: Record<string, unknown> = {};

    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.completed !== undefined) updates.completed = data.completed;
    if (data.priority !== undefined) updates.priority = data.priority;
    if (data.dueDate !== undefined) updates.dueDate = data.dueDate;
    if (data.tags !== undefined) updates.tags = stringifyArray(data.tags);

    db.update(schema.todos).set(updates).where(eq(schema.todos.id, id)).run();
}

export function deleteTodo(id: string) {
    db.delete(schema.todos).where(eq(schema.todos.id, id)).run();
}

// Notes
export function getAllNotes() {
    const notes = db.select().from(schema.notes).all();
    return notes.map((note) => ({
        id: note.id,
        title: note.title,
        content: note.content,
        pinned: note.pinned,
        tags: parseJsonArray<string>(note.tags),
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
    }));
}

export function createNote(data: {
    title: string;
    content: string;
    tags: string[];
    pinned: boolean;
}) {
    const id = crypto.randomUUID();
    const now = Date.now();

    db.insert(schema.notes)
        .values({
            id,
            title: data.title,
            content: data.content,
            tags: stringifyArray(data.tags),
            pinned: data.pinned,
            createdAt: now,
            updatedAt: now,
        })
        .run();

    return { id };
}

export function updateNote(
    id: string,
    data: Partial<{
        title: string;
        content: string;
        tags: string[];
        pinned: boolean;
        updatedAt: number;
    }>,
) {
    const updates: Record<string, unknown> = {
        updatedAt: data.updatedAt ?? Date.now(),
    };

    if (data.title !== undefined) updates.title = data.title;
    if (data.content !== undefined) updates.content = data.content;
    if (data.tags !== undefined) updates.tags = stringifyArray(data.tags);
    if (data.pinned !== undefined) updates.pinned = data.pinned;

    db.update(schema.notes).set(updates).where(eq(schema.notes.id, id)).run();
}

export function deleteNote(id: string) {
    db.delete(schema.notes).where(eq(schema.notes.id, id)).run();
}

// Habits
export function getAllHabits() {
    const habits = db.select().from(schema.habits).all();
    return habits.map((habit) => ({
        id: habit.id,
        name: habit.name,
        description: habit.description ?? undefined,
        frequency: habit.frequency as 'daily' | 'weekly' | 'monthly',
        targetCount: habit.targetCount,
        color: habit.color,
        icon: habit.icon,
        completedDates: parseJsonArray<string>(habit.completedDates),
        createdAt: habit.createdAt,
    }));
}

export function createHabit(data: {
    name: string;
    description?: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    targetCount: number;
    color: string;
    icon: string;
}) {
    const id = crypto.randomUUID();
    const now = Date.now();

    db.insert(schema.habits)
        .values({
            id,
            name: data.name,
            description: data.description ?? null,
            frequency: data.frequency,
            targetCount: data.targetCount,
            color: data.color,
            icon: data.icon,
            completedDates: stringifyArray([]),
            createdAt: now,
        })
        .run();

    return { id };
}

export function updateHabit(
    id: string,
    data: Partial<{
        name: string;
        description: string;
        frequency: 'daily' | 'weekly' | 'monthly';
        targetCount: number;
        color: string;
        icon: string;
        completedDates: string[];
    }>,
) {
    const updates: Record<string, unknown> = {};

    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.frequency !== undefined) updates.frequency = data.frequency;
    if (data.targetCount !== undefined) updates.targetCount = data.targetCount;
    if (data.color !== undefined) updates.color = data.color;
    if (data.icon !== undefined) updates.icon = data.icon;
    if (data.completedDates !== undefined)
        updates.completedDates = stringifyArray(data.completedDates);

    db.update(schema.habits).set(updates).where(eq(schema.habits.id, id)).run();
}

export function deleteHabit(id: string) {
    db.delete(schema.habits).where(eq(schema.habits.id, id)).run();
}

// Pomodoro Sessions
export function getAllPomodoroSessions() {
    const sessions = db.select().from(schema.pomodoroSessions).all();
    return sessions.map((session) => ({
        id: session.id,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime ?? undefined,
        phase: session.phase as 'focus' | 'short-break' | 'long-break',
        duration: session.duration,
        completed: session.completed,
    }));
}

export function createPomodoroSession(data: {
    date: string;
    startTime: string;
    phase: 'focus' | 'short-break' | 'long-break';
    duration: number;
    completed: boolean;
}) {
    const id = crypto.randomUUID();

    db.insert(schema.pomodoroSessions)
        .values({
            id,
            date: data.date,
            startTime: data.startTime,
            endTime: null,
            phase: data.phase,
            duration: data.duration,
            completed: data.completed,
        })
        .run();

    return { id };
}

export function updatePomodoroSession(
    id: string,
    data: Partial<{
        completed: boolean;
        endTime: string;
    }>,
) {
    const updates: Record<string, unknown> = {};

    if (data.completed !== undefined) updates.completed = data.completed;
    if (data.endTime !== undefined) updates.endTime = data.endTime;

    db.update(schema.pomodoroSessions)
        .set(updates)
        .where(eq(schema.pomodoroSessions.id, id))
        .run();
}

export function deletePomodoroSession(id: string) {
    db.delete(schema.pomodoroSessions)
        .where(eq(schema.pomodoroSessions.id, id))
        .run();
}

// Settings
export function getSettings() {
    const settings = db
        .select()
        .from(schema.settings)
        .where(eq(schema.settings.id, 1))
        .get();

    if (!settings) {
        throw new Error('Settings not found');
    }

    return {
        theme: settings.theme as 'light' | 'dark' | 'system',
        clockInPromptOnLaunch: settings.clockInPromptOnLaunch ?? true,
        pomodoro: {
            focusTime: settings.pomodoroFocusTime,
            shortBreakTime: settings.pomodoroShortBreakTime,
            longBreakTime: settings.pomodoroLongBreakTime,
            longBreakInterval: settings.pomodoroLongBreakInterval,
            autoStartPomodoros: settings.pomodoroAutoStartPomodoros,
            autoStartBreaks: settings.pomodoroAutoStartBreaks,
            soundEnabled: settings.pomodoroSoundEnabled,
        },
        notifications: {
            pomodoroComplete: true,
            breakComplete: true,
        },
    };
}

export function updateSettings(
    data: Partial<{
        theme: 'light' | 'dark' | 'system';
        clockInPromptOnLaunch: boolean;
        pomodoro: Partial<{
            focusTime: number;
            shortBreakTime: number;
            longBreakTime: number;
            longBreakInterval: number;
            autoStartPomodoros: boolean;
            autoStartBreaks: boolean;
            soundEnabled: boolean;
        }>;
    }>,
) {
    type SettingsUpdate = Partial<typeof schema.settings.$inferInsert>;
    const updates: SettingsUpdate = {};

    if (data.theme !== undefined) updates.theme = data.theme;
    if (data.pomodoro?.focusTime !== undefined)
        updates.pomodoroFocusTime = data.pomodoro.focusTime;
    if (data.pomodoro?.shortBreakTime !== undefined)
        updates.pomodoroShortBreakTime = data.pomodoro.shortBreakTime;
    if (data.pomodoro?.longBreakTime !== undefined)
        updates.pomodoroLongBreakTime = data.pomodoro.longBreakTime;
    if (data.pomodoro?.longBreakInterval !== undefined)
        updates.pomodoroLongBreakInterval = data.pomodoro.longBreakInterval;
    if (data.pomodoro?.autoStartPomodoros !== undefined)
        updates.pomodoroAutoStartPomodoros = data.pomodoro.autoStartPomodoros;
    if (data.pomodoro?.autoStartBreaks !== undefined)
        updates.pomodoroAutoStartBreaks = data.pomodoro.autoStartBreaks;
    if (data.pomodoro?.soundEnabled !== undefined)
        updates.pomodoroSoundEnabled = data.pomodoro.soundEnabled;

    if (Object.keys(updates).length > 0) {
        db.update(schema.settings)
            .set(updates)
            .where(eq(schema.settings.id, 1))
            .run();
    }

    // Persist clock-in prompt via raw SQL to avoid boolean serialization issues
    if (data.clockInPromptOnLaunch !== undefined) {
        sqlite
            .prepare(
                'UPDATE settings SET clock_in_prompt_on_launch = ? WHERE id = 1',
            )
            .run(data.clockInPromptOnLaunch ? 1 : 0);
    }
}

// Active Timer
export function getActiveTimer() {
    const timer = db
        .select()
        .from(schema.activeTimer)
        .where(eq(schema.activeTimer.id, 1))
        .get();

    if (!timer || !timer.isRunning) {
        return undefined;
    }

    return {
        isRunning: timer.isRunning,
        phase: timer.phase as 'focus' | 'short-break' | 'long-break',
        startedAt: timer.startedAt ?? undefined,
        totalDuration: timer.totalDuration ?? 0,
        cycleCount: timer.cycleCount,
    };
}

export function setActiveTimer(
    data: {
        isRunning: boolean;
        phase: 'focus' | 'short-break' | 'long-break';
        startedAt?: number;
        totalDuration: number;
        cycleCount: number;
    } | null,
) {
    if (data === null) {
        db.update(schema.activeTimer)
            .set({
                isRunning: false,
                phase: null,
                startedAt: null,
                totalDuration: null,
                cycleCount: 0,
            })
            .where(eq(schema.activeTimer.id, 1))
            .run();
    } else {
        db.update(schema.activeTimer)
            .set({
                isRunning: data.isRunning,
                phase: data.phase,
                startedAt: data.startedAt ?? null,
                totalDuration: data.totalDuration,
                cycleCount: data.cycleCount,
            })
            .where(eq(schema.activeTimer.id, 1))
            .run();
    }
}

// Get all app data
export function getAllAppData() {
    return {
        workLogs: getAllWorkLogs(),
        todos: getAllTodos(),
        notes: getAllNotes(),
        habits: getAllHabits(),
        pomodoroSessions: getAllPomodoroSessions(),
        settings: getSettings(),
        activeTimer: getActiveTimer(),
    };
}
