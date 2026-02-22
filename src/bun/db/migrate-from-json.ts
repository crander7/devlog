import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { ActiveTimerState } from '../../shared/rpc-types';
import * as dbHandlers from './handlers';

function getOldDataFile(): string {
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

    return join(userDataPath, 'devlog-data.json');
}

interface OldWorkLog {
    id?: string;
    date: string;
    description: string;
    tags?: string[];
    startTime?: string;
    endTime?: string;
}

interface OldTodo {
    id?: string;
    title: string;
    description?: string;
    completed: boolean;
    priority?: string;
    dueDate?: string;
    tags?: string[];
}

interface OldNote {
    id?: string;
    title: string;
    content: string;
    tags?: string[];
    pinned?: boolean;
}

interface OldHabit {
    id?: string;
    name: string;
    description?: string;
}

interface OldPomodoroSession {
    id?: string;
    date: string;
    startTime: string;
    phase?: string;
    duration?: number;
    completed?: boolean;
}

interface OldAppData {
    workLogs?: OldWorkLog[];
    todos?: OldTodo[];
    notes?: OldNote[];
    habits?: OldHabit[];
    pomodoroSessions?: OldPomodoroSession[];
    settings?: Record<string, unknown>;
    activeTimer?: Record<string, unknown> | null;
}

export function migrateFromJSON(): { success: boolean; message: string } {
    const oldDataFile = getOldDataFile();

    if (!existsSync(oldDataFile)) {
        return {
            success: true,
            message:
                'No existing JSON data file found. Starting fresh with SQLite.',
        };
    }

    try {
        const jsonData = readFileSync(oldDataFile, 'utf8');
        const oldData: OldAppData = JSON.parse(jsonData);

        let migratedCount = 0;

        for (const log of oldData.workLogs || []) {
            try {
                dbHandlers.createWorkLog({
                    date: log.date,
                    description: log.description,
                    tags: log.tags || [],
                    startTime: log.startTime,
                    endTime: log.endTime,
                });
                migratedCount++;
            } catch (error) {
                console.warn('Failed to migrate work log:', log.id, error);
            }
        }

        for (const todo of oldData.todos || []) {
            try {
                dbHandlers.createTodo({
                    title: todo.title,
                    description: todo.description,
                    completed: todo.completed,
                    priority: todo.priority as 'low' | 'medium' | 'high',
                    dueDate: todo.dueDate,
                    tags: todo.tags || [],
                });
                migratedCount++;
            } catch (error) {
                console.warn('Failed to migrate todo:', todo.id, error);
            }
        }

        for (const note of oldData.notes || []) {
            try {
                dbHandlers.createNote({
                    title: note.title,
                    content: note.content,
                    tags: note.tags || [],
                    pinned: note.pinned ?? false,
                });
                migratedCount++;
            } catch (error) {
                console.warn('Failed to migrate note:', note.id, error);
            }
        }

        for (const habit of oldData.habits || []) {
            try {
                dbHandlers.createHabit({
                    name: habit.name,
                    description: habit.description,
                    frequency: 'daily',
                    targetCount: 1,
                    color: '#8b5cf6',
                    icon: 'target',
                });
                migratedCount++;
            } catch (error) {
                console.warn('Failed to migrate habit:', habit.id, error);
            }
        }

        for (const session of oldData.pomodoroSessions || []) {
            try {
                dbHandlers.createPomodoroSession({
                    date: session.date,
                    startTime: session.startTime,
                    phase: session.phase as
                        | 'focus'
                        | 'short-break'
                        | 'long-break',
                    duration: session.duration ?? 0,
                    completed: session.completed ?? false,
                });
                migratedCount++;
            } catch (error) {
                console.warn(
                    'Failed to migrate pomodoro session:',
                    session.id,
                    error,
                );
            }
        }

        if (oldData.settings) {
            try {
                dbHandlers.updateSettings(oldData.settings);
            } catch (error) {
                console.warn('Failed to migrate settings:', error);
            }
        }

        if (oldData.activeTimer) {
            try {
                dbHandlers.setActiveTimer(
                    oldData.activeTimer as unknown as ActiveTimerState | null,
                );
            } catch (error) {
                console.warn('Failed to migrate active timer:', error);
            }
        }

        const backupPath = `${oldDataFile}.backup`;
        copyFileSync(oldDataFile, backupPath);

        return {
            success: true,
            message: `Successfully migrated ${migratedCount} items from JSON to SQLite. Old data backed up to: ${backupPath}`,
        };
    } catch (error) {
        return {
            success: false,
            message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}
