import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Work Logs
export const workLogs = sqliteTable('work_logs', {
    id: text('id').primaryKey(),
    date: text('date').notNull(),
    description: text('description').notNull(),
    tags: text('tags').notNull(), // JSON array
    startTime: text('start_time'),
    endTime: text('end_time'),
    duration: integer('duration'),
    createdAt: integer('created_at').notNull(),
});

// Todos
export const todos = sqliteTable('todos', {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description'),
    completed: integer('completed', { mode: 'boolean' })
        .notNull()
        .default(false),
    priority: text('priority').notNull().default('medium'), // 'low' | 'medium' | 'high'
    dueDate: text('due_date'),
    tags: text('tags').notNull(), // JSON array
    createdAt: integer('created_at').notNull(),
});

// Notes
export const notes = sqliteTable('notes', {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    tags: text('tags').notNull(), // JSON array
    pinned: integer('pinned', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
});

// Habits
export const habits = sqliteTable('habits', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    frequency: text('frequency').notNull(), // 'daily' | 'weekly' | 'monthly'
    targetCount: integer('target_count').notNull(),
    color: text('color').notNull(),
    icon: text('icon').notNull(),
    completedDates: text('completed_dates').notNull(), // JSON array
    createdAt: integer('created_at').notNull(),
});

// Pomodoro Sessions
export const pomodoroSessions = sqliteTable('pomodoro_sessions', {
    id: text('id').primaryKey(),
    date: text('date').notNull(),
    startTime: text('start_time').notNull(),
    endTime: text('end_time'),
    phase: text('phase').notNull(), // 'focus' | 'short-break' | 'long-break'
    duration: integer('duration').notNull(),
    completed: integer('completed', { mode: 'boolean' })
        .notNull()
        .default(false),
});

// Settings
export const settings = sqliteTable('settings', {
    id: integer('id').primaryKey(), // Single row with id=1
    theme: text('theme').notNull().default('dark'),
    pomodoroFocusTime: integer('pomodoro_focus_time').notNull().default(25),
    pomodoroShortBreakTime: integer('pomodoro_short_break_time')
        .notNull()
        .default(5),
    pomodoroLongBreakTime: integer('pomodoro_long_break_time')
        .notNull()
        .default(15),
    pomodoroLongBreakInterval: integer('pomodoro_long_break_interval')
        .notNull()
        .default(4),
    pomodoroAutoStartPomodoros: integer('pomodoro_auto_start_pomodoros', {
        mode: 'boolean',
    })
        .notNull()
        .default(false),
    pomodoroAutoStartBreaks: integer('pomodoro_auto_start_breaks', {
        mode: 'boolean',
    })
        .notNull()
        .default(false),
    pomodoroSoundEnabled: integer('pomodoro_sound_enabled', {
        mode: 'boolean',
    })
        .notNull()
        .default(true),
});

// Active Timer (single row state)
export const activeTimer = sqliteTable('active_timer', {
    id: integer('id').primaryKey(), // Single row with id=1
    isRunning: integer('is_running', { mode: 'boolean' })
        .notNull()
        .default(false),
    phase: text('phase'), // 'focus' | 'short-break' | 'long-break'
    startedAt: integer('started_at'),
    totalDuration: integer('total_duration'),
    cycleCount: integer('cycle_count').notNull().default(0),
});
