import { Database } from 'bun:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';

function getDbPath(): string {
    const platform = process.platform;
    let userDataPath: string;

    if (platform === 'darwin') {
        userDataPath = join(
            homedir(),
            'Library',
            'Application Support',
            'devlog',
        );
    } else if (platform === 'win32') {
        userDataPath = join(homedir(), 'AppData', 'Roaming', 'devlog');
    } else {
        userDataPath = join(homedir(), '.config', 'devlog');
    }

    if (!existsSync(userDataPath)) {
        mkdirSync(userDataPath, { recursive: true });
    }

    return join(userDataPath, 'devlog.db');
}

const dbPath = getDbPath();
const sqlite = new Database(dbPath);

sqlite.exec('PRAGMA journal_mode = WAL;');

export const db = drizzle(sqlite, { schema });
export { sqlite };

export function initializeDatabase() {
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
            pomodoro_sound_enabled INTEGER NOT NULL DEFAULT 1,
            clock_in_prompt_on_launch INTEGER NOT NULL DEFAULT 1
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

    // Migrate: add clock_in_prompt_on_launch column if missing
    const settingsCols = sqlite
        .prepare("PRAGMA table_info('settings')")
        .all() as { name: string }[];
    if (!settingsCols.some((c) => c.name === 'clock_in_prompt_on_launch')) {
        sqlite.exec(
            'ALTER TABLE settings ADD COLUMN clock_in_prompt_on_launch INTEGER NOT NULL DEFAULT 1',
        );
    }

    const existingSettings = sqlite
        .prepare('SELECT COUNT(*) as count FROM settings WHERE id = 1')
        .get() as { count: number };

    if (existingSettings.count === 0) {
        sqlite
            .prepare(
                `INSERT INTO settings (
                    id, theme, pomodoro_focus_time, pomodoro_short_break_time,
                    pomodoro_long_break_time, pomodoro_long_break_interval,
                    pomodoro_auto_start_pomodoros, pomodoro_auto_start_breaks,
                    pomodoro_sound_enabled, clock_in_prompt_on_launch
                ) VALUES (1, 'dark', 25, 5, 15, 4, 0, 0, 1, 1)`,
            )
            .run();
    }

    const existingTimer = sqlite
        .prepare('SELECT COUNT(*) as count FROM active_timer WHERE id = 1')
        .get() as { count: number };

    if (existingTimer.count === 0) {
        sqlite
            .prepare(
                `INSERT INTO active_timer (id, is_running, cycle_count)
                VALUES (1, 0, 0)`,
            )
            .run();
    }

    // console.log('Database initialized at:', dbPath);
}

export function closeDatabase() {
    sqlite.close();
}
