import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import * as dbHandlers from './handlers';

const OLD_DATA_FILE = path.join(app.getPath('userData'), 'devlog-data.json');

interface OldAppData {
    workLogs: any[];
    todos: any[];
    notes: any[];
    habits: any[];
    pomodoroSessions: any[];
    settings: any;
    activeTimer?: any;
}

export function migrateFromJSON(): { success: boolean; message: string } {
    // Check if old JSON file exists
    if (!fs.existsSync(OLD_DATA_FILE)) {
        return {
            success: true,
            message:
                'No existing JSON data file found. Starting fresh with SQLite.',
        };
    }

    try {
        // Read old JSON data
        const jsonData = fs.readFileSync(OLD_DATA_FILE, 'utf8');
        const oldData: OldAppData = JSON.parse(jsonData);

        let migratedCount = 0;

        // Migrate Work Logs
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

        // Migrate Todos
        for (const todo of oldData.todos || []) {
            try {
                dbHandlers.createTodo({
                    title: todo.title,
                    description: todo.description,
                    completed: todo.completed,
                    priority: todo.priority,
                    dueDate: todo.dueDate,
                    tags: todo.tags || [],
                });
                migratedCount++;
            } catch (error) {
                console.warn('Failed to migrate todo:', todo.id, error);
            }
        }

        // Migrate Notes
        for (const note of oldData.notes || []) {
            try {
                dbHandlers.createNote({
                    title: note.title,
                    content: note.content,
                    tags: note.tags || [],
                    pinned: note.pinned,
                });
                migratedCount++;
            } catch (error) {
                console.warn('Failed to migrate note:', note.id, error);
            }
        }

        // Migrate Habits
        for (const habit of oldData.habits || []) {
            try {
                // Convert old habit format to new format
                const completedDates: string[] = [];
                if (habit.lastCompleted) {
                    // Add last completed date
                    completedDates.push(habit.lastCompleted);
                    // Add streak dates (approximate)
                    for (let i = 1; i < habit.streak; i++) {
                        const date = new Date(habit.lastCompleted);
                        date.setDate(date.getDate() - i);
                        completedDates.push(date.toISOString().split('T')[0]);
                    }
                }

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

        // Migrate Pomodoro Sessions
        for (const session of oldData.pomodoroSessions || []) {
            try {
                dbHandlers.createPomodoroSession({
                    date: session.date,
                    startTime: session.startTime,
                    phase: session.phase,
                    duration: session.duration,
                    completed: session.completed,
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

        // Migrate Settings
        if (oldData.settings) {
            try {
                dbHandlers.updateSettings(oldData.settings);
            } catch (error) {
                console.warn('Failed to migrate settings:', error);
            }
        }

        // Migrate Active Timer
        if (oldData.activeTimer) {
            try {
                dbHandlers.setActiveTimer(oldData.activeTimer);
            } catch (error) {
                console.warn('Failed to migrate active timer:', error);
            }
        }

        // Backup old JSON file
        const backupPath = `${OLD_DATA_FILE}.backup`;
        fs.copyFileSync(OLD_DATA_FILE, backupPath);

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
