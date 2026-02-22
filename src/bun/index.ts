import {
    chmodSync,
    closeSync,
    existsSync,
    mkdirSync,
    openSync,
    readFileSync,
    unlinkSync,
    writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import Electrobun, {
    ApplicationMenu,
    BrowserView,
    BrowserWindow,
    Tray,
    Utils,
} from 'electrobun/bun';
import type { ActiveTimerState, DevLogRPC } from '../shared/rpc-types';
import * as dbHandlers from './db/handlers';
import { closeDatabase, initializeDatabase } from './db/index';

// ---- App data path (used for lock and CLI) ----

function getAppDataPath(): string {
    const platform = process.platform;
    if (platform === 'darwin') {
        return join(homedir(), 'Library', 'Application Support', 'devlog');
    }
    if (platform === 'win32') {
        return join(homedir(), 'AppData', 'Roaming', 'devlog');
    }
    return join(homedir(), '.config', 'devlog');
}

// ---- Single instance lock ----

const LOCK_FILE = join(getAppDataPath(), '.single-instance.lock');

function acquireSingleInstanceLock(): boolean {
    const dir = getAppDataPath();
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
    try {
        const fd = openSync(LOCK_FILE, 'wx');
        writeFileSync(fd, String(process.pid));
        closeSync(fd);
        return true;
    } catch (err: unknown) {
        if ((err as NodeJS.ErrnoException)?.code !== 'EEXIST') throw err;
        try {
            const pidStr = readFileSync(LOCK_FILE, 'utf8').trim();
            const pid = Number.parseInt(pidStr, 10);
            if (Number.isNaN(pid)) return false;
            // Signal 0 only checks if the process exists (no kill)
            process.kill(pid, 0);
            return false; // other instance still running
        } catch {
            // process not running or file invalid – remove stale lock and retry once
            try {
                unlinkSync(LOCK_FILE);
            } catch {
                return false;
            }
            return acquireSingleInstanceLock();
        }
    }
}

if (!acquireSingleInstanceLock()) {
    process.exit(1);
}

function releaseSingleInstanceLock(): void {
    try {
        if (existsSync(LOCK_FILE)) unlinkSync(LOCK_FILE);
    } catch {
        // ignore
    }
}

// Initialize database
initializeDatabase();

// ---- Helpers ----

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function playNotificationSound(): void {
    if (process.platform === 'darwin') {
        Bun.spawn(['afplay', '/System/Library/Sounds/Glass.aiff']);
    } else if (process.platform === 'win32') {
        Bun.spawn(['rundll32', 'user32.dll,MessageBeep']);
    } else {
        Bun.spawn([
            'bash',
            '-c',
            'paplay /usr/share/sounds/freedesktop/stereo/complete.oga || beep',
        ]);
    }
}

// ---- RPC Setup ----

const devlogRPC = BrowserView.defineRPC<DevLogRPC>({
    maxRequestTime: 10000,
    handlers: {
        requests: {
            getAppData: () => {
                return dbHandlers.getAllAppData();
            },
            saveAppData: ({ data }) => {
                try {
                    if (data.activeTimer !== undefined) {
                        dbHandlers.setActiveTimer(data.activeTimer ?? null);
                    }
                    if (data.settings) {
                        dbHandlers.updateSettings(data.settings);
                    }
                    return true;
                } catch {
                    return false;
                }
            },

            createWorkLog: ({ entry }) => {
                return dbHandlers.createWorkLog(entry);
            },
            updateWorkLog: ({ id, updates }) => {
                try {
                    dbHandlers.updateWorkLog(id, updates);
                    return true;
                } catch {
                    return false;
                }
            },
            deleteWorkLog: ({ id }) => {
                try {
                    dbHandlers.deleteWorkLog(id);
                    return true;
                } catch {
                    return false;
                }
            },

            createTodo: ({ todo }) => {
                return dbHandlers.createTodo(todo);
            },
            updateTodo: ({ id, updates }) => {
                try {
                    dbHandlers.updateTodo(id, updates);
                    return true;
                } catch {
                    return false;
                }
            },
            deleteTodo: ({ id }) => {
                try {
                    dbHandlers.deleteTodo(id);
                    return true;
                } catch {
                    return false;
                }
            },

            createNote: ({ note }) => {
                return dbHandlers.createNote(note);
            },
            updateNote: ({ id, updates }) => {
                try {
                    dbHandlers.updateNote(id, updates);
                    return true;
                } catch {
                    return false;
                }
            },
            deleteNote: ({ id }) => {
                try {
                    dbHandlers.deleteNote(id);
                    return true;
                } catch {
                    return false;
                }
            },

            createHabit: ({ habit }) => {
                return dbHandlers.createHabit({
                    name: habit.name,
                    description: habit.description,
                    frequency: habit.frequency ?? 'daily',
                    targetCount: habit.targetCount ?? 1,
                    color: habit.color ?? '#8b5cf6',
                    icon: habit.icon ?? 'target',
                });
            },
            updateHabit: ({ id, updates }) => {
                try {
                    dbHandlers.updateHabit(id, updates);
                    return true;
                } catch {
                    return false;
                }
            },
            deleteHabit: ({ id }) => {
                try {
                    dbHandlers.deleteHabit(id);
                    return true;
                } catch {
                    return false;
                }
            },
            completeHabit: ({ id }) => {
                try {
                    const habits = dbHandlers.getAllHabits();
                    const habit = habits.find((h) => h.id === id);
                    if (!habit) return false;

                    const today = new Date().toISOString().split('T')[0];

                    if (habit.completedDates.includes(today)) {
                        return true;
                    }

                    const updatedDates = [...habit.completedDates, today];
                    dbHandlers.updateHabit(id, {
                        completedDates: updatedDates,
                    });
                    return true;
                } catch {
                    return false;
                }
            },

            createPomodoroSession: ({ session }) => {
                return dbHandlers.createPomodoroSession(session);
            },
            updatePomodoroSession: ({ id, updates }) => {
                try {
                    dbHandlers.updatePomodoroSession(id, updates);
                    return true;
                } catch {
                    return false;
                }
            },

            getSettings: () => {
                return dbHandlers.getSettings();
            },
            updateSettings: ({ settings }) => {
                try {
                    dbHandlers.updateSettings(settings);
                    return true;
                } catch {
                    return false;
                }
            },
        },
        messages: {
            playNotificationSound: () => {
                playNotificationSound();
            },
            updateTrayTimer: ({ timerState }) => {
                updateTrayMenu(timerState);
            },
        },
    },
});

// ---- Application Menu ----

ApplicationMenu.setApplicationMenu([
    {
        submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' },
        ],
    },
    {
        label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { role: 'selectAll' },
        ],
    },
]);

// ---- Window Creation ----

const isDev =
    process.env.ELECTROBUN_DEV === '1' ||
    process.env.NODE_ENV === 'development';
// Use localhost only when Vite dev server is running (HMR); otherwise load bundled view
const useViteDev = process.env.USE_VITE_DEV === '1';

const allowedOrigins = new Set([
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'views://main/',
]);

function isAllowedNavigationUrl(url: string): boolean {
    if (!url) return false;
    return Array.from(allowedOrigins).some(
        (origin) => url === origin || url.startsWith(origin),
    );
}

function createMainWindow(): BrowserWindow<typeof devlogRPC> {
    const w = new BrowserWindow({
        title: 'DevLog',
        url: useViteDev ? 'http://localhost:5173' : 'views://main/index.html',
        frame: {
            width: 1200,
            height: 800,
            x: 100,
            y: 100,
        },
        rpc: devlogRPC,
    });
    Electrobun.events.on(`close-${w.id}`, () => {
        if (mainWindow?.id === w.id) mainWindow = null;
    });
    return w;
}

let mainWindow: BrowserWindow<typeof devlogRPC> | null = createMainWindow();

function showOrCreateMainWindow(): void {
    if (mainWindow) {
        mainWindow.focus();
        return;
    }
    mainWindow = createMainWindow();
    mainWindow.focus();
}

// Navigation security: only allow app URLs
Electrobun.events.on(
    'will-navigate',
    (e: { data: { detail: string }; response?: { allow?: boolean } }) => {
        const url = typeof e.data.detail === 'string' ? e.data.detail : '';
        if (!isAllowedNavigationUrl(url)) {
            (e as { response?: { allow?: boolean } }).response = {
                allow: false,
            };
        }
    },
);

// Block new windows (e.g. target="_blank", window.open)
Electrobun.events.on('new-window-open', (e: { data: { detail: unknown } }) => {
    (e as { response?: { allow?: boolean } }).response = { allow: false };
});

// Dock / activate: when user clicks dock icon (open-url can fire on macOS), show window
Electrobun.events.on('open-url', () => {
    showOrCreateMainWindow();
});

// Release lock when quitting via app menu so a new instance can start
Electrobun.events.on('before-quit', () => {
    releaseSingleInstanceLock();
});

// ---- System Tray ----

const tray = new Tray({
    title: '🍅 25:00',
    template: false,
    width: 16,
    height: 16,
});

function updateTrayMenu(timerState?: ActiveTimerState | null): void {
    let activeTimer = timerState;

    if (activeTimer === undefined) {
        activeTimer = dbHandlers.getActiveTimer() ?? null;
    }

    let timerLabel: string;
    if (activeTimer?.isRunning && activeTimer?.startedAt) {
        const elapsed = Math.floor((Date.now() - activeTimer.startedAt) / 1000);
        const remaining = Math.max(0, activeTimer.totalDuration - elapsed);
        timerLabel = `${activeTimer.phase === 'focus' ? '🍅' : '☕'} ${formatTime(remaining)}`;
    } else {
        const settings = dbHandlers.getSettings();
        const focusMinutes = settings.pomodoro.focusTime;
        const focusSeconds = focusMinutes * 60;
        timerLabel = `🍅 ${formatTime(focusSeconds)}`;
    }

    tray.setTitle(timerLabel);
    tray.setMenu([
        {
            type: 'normal',
            label: timerLabel,
            enabled: false,
            action: 'timer-label',
        },
        { type: 'divider' },
        { type: 'normal', label: 'Show App', action: 'show-app' },
        { type: 'divider' },
        { type: 'normal', label: 'Quit', action: 'quit' },
    ]);
}

tray.on('tray-clicked', (e: unknown) => {
    const event = e as { data: { id: number; action: string } };
    const { action } = event.data;

    if (action === '' || action === 'show-app') {
        showOrCreateMainWindow();
    } else if (action === 'quit') {
        closeDatabase();
        releaseSingleInstanceLock();
        process.exit(0);
    }

    if (action === '') {
        updateTrayMenu();
    }
});

updateTrayMenu();

// ---- CLI Auto-Install ----

const CLI_INSTALLED_FLAG = join(getAppDataPath(), '.cli-installed');

function isCliInstalled(): boolean {
    try {
        return Bun.spawnSync(['which', 'devlog']).exitCode === 0;
    } catch {
        return false;
    }
}

function hasAttemptedInstallation(): boolean {
    return existsSync(CLI_INSTALLED_FLAG);
}

function markInstallationAttempted(): void {
    const dir = getAppDataPath();
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
    writeFileSync(CLI_INSTALLED_FLAG, 'true');
}

async function installCli(): Promise<boolean> {
    if (isDev) return false;

    const platform = process.platform;

    try {
        if (platform === 'darwin' || platform === 'linux') {
            const localBin = join(homedir(), '.local', 'bin');
            if (!existsSync(localBin)) {
                mkdirSync(localBin, { recursive: true });
            }
            const cliTarget = join(localBin, 'devlog');
            const wrapperScript = `#!/bin/bash\nexec bun "${join(getAppDataPath(), 'cli.js')}" "$@"\n`;
            writeFileSync(cliTarget, wrapperScript);
            chmodSync(cliTarget, 0o755);
            return true;
        }

        if (platform === 'win32') {
            const localBin = join(homedir(), 'AppData', 'Local', 'devlog');
            if (!existsSync(localBin)) {
                mkdirSync(localBin, { recursive: true });
            }
            const cliTarget = join(localBin, 'devlog.bat');
            const batchScript = `@echo off\nbun "${join(getAppDataPath(), 'cli.js')}" %*\n`;
            writeFileSync(cliTarget, batchScript);
            return true;
        }
    } catch (err) {
        console.error('Failed to install CLI:', err);
    }

    return false;
}

if (!isCliInstalled() && !hasAttemptedInstallation()) {
    markInstallationAttempted();
    installCli().then(async (installed) => {
        if (installed) {
            await Utils.showMessageBox({
                type: 'info',
                title: 'CLI Installed',
                message: 'You can now use devlog from your terminal.',
                detail: 'Commands: devlog ci (check in), devlog co (check out), and more. Ensure the install directory is on your PATH (e.g. ~/.local/bin).',
            });
        }
    });
}

// ---- Cleanup ----

process.on('beforeExit', () => {
    releaseSingleInstanceLock();
    closeDatabase();
});
