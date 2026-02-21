import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { app } from 'electron';
import * as schema from './schema';

// Get database path in user data directory
const dbPath = path.join(app.getPath('userData'), 'devlog.db');

// Initialize SQLite database
const sqlite = new Database(dbPath);

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL');

// Create Drizzle instance
export const db = drizzle(sqlite, { schema });

// Initialize database with default settings if needed
export function initializeDatabase() {
    // Create tables (idempotent - only creates if not exists)
    sqlite.exec(`
        CREATE TABLE IF NOT EXISTS work_logs (
            id TEXT PRIMARY KEY,
            date TEXT NOT NULL,
            description TEXT NOT NULL,
            tags TEXT NOT NULL,
            start_time TEXT,
            end_time TEXT,
            duration INTEGER,
            created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS todos (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            completed INTEGER NOT NULL DEFAULT 0,
            priority TEXT NOT NULL DEFAULT 'medium',
            due_date TEXT,
            tags TEXT NOT NULL,
            created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            tags TEXT NOT NULL,
            pinned INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS habits (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            frequency TEXT NOT NULL,
            target_count INTEGER NOT NULL,
            color TEXT NOT NULL,
            icon TEXT NOT NULL,
            completed_dates TEXT NOT NULL,
            created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS pomodoro_sessions (
            id TEXT PRIMARY KEY,
            date TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT,
            phase TEXT NOT NULL,
            duration INTEGER NOT NULL,
            completed INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY,
            theme TEXT NOT NULL DEFAULT 'dark',
            pomodoro_focus_time INTEGER NOT NULL DEFAULT 25,
            pomodoro_short_break_time INTEGER NOT NULL DEFAULT 5,
            pomodoro_long_break_time INTEGER NOT NULL DEFAULT 15,
            pomodoro_long_break_interval INTEGER NOT NULL DEFAULT 4,
            pomodoro_auto_start_pomodoros INTEGER NOT NULL DEFAULT 0,
            pomodoro_auto_start_breaks INTEGER NOT NULL DEFAULT 0,
            pomodoro_sound_enabled INTEGER NOT NULL DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS active_timer (
            id INTEGER PRIMARY KEY,
            is_running INTEGER NOT NULL DEFAULT 0,
            phase TEXT,
            started_at INTEGER,
            total_duration INTEGER,
            cycle_count INTEGER NOT NULL DEFAULT 0
        );

        CREATE INDEX IF NOT EXISTS idx_work_logs_date ON work_logs(date);
        CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
        CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
        CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(pinned);
        CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at);
        CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_date ON pomodoro_sessions(date);
    `);

    // Initialize settings if not exists
    const existingSettings = sqlite
        .prepare('SELECT COUNT(*) as count FROM settings WHERE id = 1')
        .get() as { count: number };

    if (existingSettings.count === 0) {
        sqlite
            .prepare(
                `
            INSERT INTO settings (
                id, theme, pomodoro_focus_time, pomodoro_short_break_time,
                pomodoro_long_break_time, pomodoro_long_break_interval,
                pomodoro_auto_start_pomodoros, pomodoro_auto_start_breaks,
                pomodoro_sound_enabled
            ) VALUES (1, 'dark', 25, 5, 15, 4, 0, 0, 1)
        `,
            )
            .run();
    }

    // Initialize active timer if not exists
    const existingTimer = sqlite
        .prepare('SELECT COUNT(*) as count FROM active_timer WHERE id = 1')
        .get() as { count: number };

    if (existingTimer.count === 0) {
        sqlite
            .prepare(
                `
            INSERT INTO active_timer (id, is_running, cycle_count)
            VALUES (1, 0, 0)
        `,
            )
            .run();
    }

    console.log('Database initialized at:', dbPath);
}

// Helper to close database (call on app quit)
export function closeDatabase() {
    sqlite.close();
}
