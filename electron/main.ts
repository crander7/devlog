import { exec, execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    app,
    BrowserWindow,
    dialog,
    ipcMain,
    Menu,
    nativeImage,
    Tray,
} from 'electron';
import * as dbHandlers from './db/handlers';
import { closeDatabase, initializeDatabase } from './db/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLI_INSTALLED_FLAG = path.join(app.getPath('userData'), '.cli-installed');

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
    // streak: number;
    // longestStreak: number;
    // lastCompleted?: string;
    // updatedAt: number;
    createdAt: number;
    frequency: 'daily' | 'weekly' | 'monthly';
    targetCount: number;
    color: string;
    icon: string;
    completedDates: string[];
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

export interface AppSettings {
    theme: 'light' | 'dark' | 'system';
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

export interface ActiveTimerState {
    isRunning: boolean;
    phase: 'focus' | 'short-break' | 'long-break';
    startedAt?: number;
    totalDuration: number;
    cycleCount: number;
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

// Database functions are now in ./db/handlers.ts

// Lock computer (platform-specific)
function lockComputer(): void {
    const platform = process.platform;

    if (platform === 'darwin') {
        // macOS - Lock screen using Control+Command+Q
        exec(
            'osascript -e \'tell application "System Events" to keystroke "q" using {control down, command down}\'',
            (error) => {
                if (error) {
                    console.error('Error locking computer:', error);
                }
            },
        );
        // exec('pmset displaysleepnow', (error) => {
        //     if (error) {
        //         console.error('Error locking computer:', error);
        //     }
        // });
    } else if (platform === 'win32') {
        // Windows
        exec('rundll32.exe user32.dll,LockWorkStation', (error) => {
            if (error) {
                console.error('Error locking computer:', error);
            }
        });
    } else if (platform === 'linux') {
        // Linux
        exec(
            'gnome-screensaver-command -l || xdg-screensaver lock',
            (error) => {
                if (error) {
                    console.error('Error locking computer:', error);
                }
            },
        );
    }
}

export interface WorkLogEntry {
    clockIn?: string;
    clockOut?: string;
    workDescription?: string;
    timestamp: number;
}

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        // Someone tried to run a second instance, focus our window instead
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    // Filter out common Electron/Chromium noise
    if (
        !error.message.includes('GPU process') &&
        !error.message.includes('Network service') &&
        !error.message.includes('gpu_process_host') &&
        !error.message.includes('network_service_instance_impl')
    ) {
        console.error('Uncaught Exception:', error);
    }
    // Don't exit the process, just log the error
});

process.on('unhandledRejection', (reason) => {
    // Filter out common Electron/Chromium noise
    const reasonStr = String(reason);
    if (
        !reasonStr.includes('GPU process') &&
        !reasonStr.includes('Network service') &&
        !reasonStr.includes('gpu_process_host') &&
        !reasonStr.includes('network_service_instance_impl')
    ) {
        console.error('Unhandled Rejection:', reason);
    }
    // Don't exit the process, just log the error
});

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let trayTimerInterval: NodeJS.Timeout | null = null;

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function createTray(): void {
    // Create a simple text-based icon for the tray
    // const createTrayIcon = (text: string) => {
    //     // Create a canvas-like buffer (16x16 for macOS menubar)
    //     const size = 16;
    //     const canvas = Buffer.alloc(size * size * 4); // RGBA

    //     // Simple approach: use a template image or emoji
    //     // For now, use a simple circle/dot as placeholder
    //     return nativeImage.createFromBuffer(canvas, {
    //         width: size,
    //         height: size,
    //     });
    // };

    // Use a clock emoji or symbol for the tray icon
    const icon = nativeImage.createFromDataURL(
        'data:image/svg+xml;utf8,<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg"><text x="0" y="13" font-size="14">⏱</text></svg>',
    );
    tray = new Tray(icon);

    tray.setToolTip('Pomodoro Timer - Click to show app');

    updateTrayMenu();

    // Click on tray shows/hides main window
    tray.on('click', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
                mainWindow.focus();
            }
        }
    });
}

function updateTrayMenu(
    activeTimer?: ActiveTimerState | null,
    timerText?: string,
): void {
    if (!tray) return;

    // If activeTimer is null (explicitly stopped), don't read from database
    // If activeTimer is undefined (not provided), read from database for backward compatibility
    if (activeTimer === undefined) {
        activeTimer = dbHandlers.getActiveTimer();
    }

    let timerLabel: string;
    if (activeTimer?.isRunning && activeTimer?.startedAt) {
        const elapsed = Math.floor((Date.now() - activeTimer.startedAt) / 1000);
        const remaining = Math.max(0, activeTimer.totalDuration - elapsed);
        timerLabel = `${activeTimer.phase === 'focus' ? '🍅' : '☕'} ${formatTime(remaining)}`;
    } else if (timerText) {
        timerLabel = timerText;
    } else {
        // Show default focus time when no timer is running
        const settings = dbHandlers.getSettings();
        const focusMinutes = settings.pomodoro.focusTime;
        const focusSeconds = focusMinutes * 60;
        timerLabel = `🍅 ${formatTime(focusSeconds)}`;
    }

    tray.setTitle(timerLabel); // Shows timer in menubar on macOS

    const contextMenu = Menu.buildFromTemplate([
        { label: timerLabel, enabled: false },
        { type: 'separator' },
        {
            label: 'Show App',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            },
        },
        { type: 'separator' },
        { label: 'Quit', click: () => app.quit() },
    ]);

    tray.setContextMenu(contextMenu);
}

// function startTrayTimerUpdate(): void {
//     if (trayTimerInterval) {
//         clearInterval(trayTimerInterval);
//     }

//     // Update tray every second
//     trayTimerInterval = setInterval(() => {
//         updateTrayMenu();
//     }, 1000);
// }

function stopTrayTimerUpdate(): void {
    if (trayTimerInterval) {
        clearInterval(trayTimerInterval);
        trayTimerInterval = null;
    }
}

function createWindow(): void {
    console.log('Creating Electron window...');
    console.log('__dirname:', __dirname);

    // Get the correct preload path (works in both dev and production/asar)
    // Use .cjs extension to explicitly mark as CommonJS when package.json has "type": "module"
    const preloadPath = path.join(__dirname, 'preload.cjs');
    console.log('Preload path:', preloadPath);
    console.log('Preload file exists:', fs.existsSync(preloadPath));

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 1024,
        minHeight: 750,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: preloadPath,
            sandbox: false, // Preload scripts need access to Node.js
            // Disable GPU acceleration issues
            disableBlinkFeatures: 'Auxclick',
            // Additional stability options
            // enableRemoteModule: false,
            allowRunningInsecureContent: false,
            webSecurity: true,
        },
        resizable: true,
        title: 'DevLog',
        show: false, // Don't show until ready
        // Additional window options for stability
        backgroundColor: '#ffffff',
    });

    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });

    // Load the Vite dev server in development, or the built files in production
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

    if (isDev) {
        console.log('Loading development URL: http://localhost:5173');
        mainWindow.loadURL('http://localhost:5173');
        // Dev tools can be opened manually with Ctrl+Shift+I (Windows/Linux) or Cmd+Option+I (Mac)

        // Add error handling for failed loads
        mainWindow.webContents.on(
            'did-fail-load',
            (_event, errorCode, errorDescription) => {
                console.error(
                    'Failed to load URL:',
                    errorCode,
                    errorDescription,
                );
                // Try to reload after a delay
                setTimeout(() => {
                    console.log('Retrying to load URL...');
                    mainWindow?.loadURL('http://localhost:5173');
                }, 2000);
            },
        );
    } else {
        // In production, files are in app.asar
        // __dirname points to app.asar/dist-electron
        // dist folder is at app.asar/dist
        const htmlPath = path.join(__dirname, '../dist/index.html');
        mainWindow.loadFile(htmlPath);
    }

    // Prevent navigation to external URLs
    mainWindow.webContents.setWindowOpenHandler(() => {
        return { action: 'deny' };
    });

    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);
        if (parsedUrl.origin !== 'http://localhost:5173' && !isDev) {
            event.preventDefault();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Set application menu (optional - remove default menu on macOS)
if (process.platform === 'darwin') {
    // macOS: Keep default menu but customize if needed
    const template: Electron.MenuItemConstructorOptions[] = [
        {
            label: app.getName(),
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
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
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' },
            ],
        },
        {
            role: 'window',
            submenu: [{ role: 'minimize' }, { role: 'close' }],
        },
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
} else {
    // Windows/Linux: Remove menu bar for cleaner look
    Menu.setApplicationMenu(null);
}

// Check if CLI is installed
function isCliInstalled(): boolean {
    try {
        execSync('which devlog', { stdio: 'ignore' });
        return true;
    } catch {
        // Try Windows path
        try {
            execSync('where devlog', { stdio: 'ignore' });
            return true;
        } catch {
            return false;
        }
    }
}

// Check if we've already attempted installation
function hasAttemptedInstallation(): boolean {
    return fs.existsSync(CLI_INSTALLED_FLAG);
}

// Mark that we've attempted installation
function markInstallationAttempted(): void {
    fs.writeFileSync(CLI_INSTALLED_FLAG, 'true');
}

// Install CLI automatically
async function installCli(): Promise<boolean> {
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
    if (isDev) {
        // Skip in development
        return false;
    }

    // Get CLI source path
    const cliSource = path.join(__dirname, '../cli/cli.js');

    if (!fs.existsSync(cliSource)) {
        console.log('CLI not found in app bundle');
        return false;
    }

    const platform = process.platform;
    let cliTarget: string;

    try {
        if (platform === 'darwin') {
            // macOS: Try to install to /usr/local/bin (may require password)
            cliTarget = '/usr/local/bin/devlog';

            // Create wrapper script
            const wrapperScript = `#!/bin/bash\nexec node "${cliSource}" "$@"\n`;

            try {
                fs.writeFileSync(cliTarget, wrapperScript);
                fs.chmodSync(cliTarget, 0o755);
                return true;
            } catch {
                // If we can't write to /usr/local/bin, try ~/.local/bin
                const localBin = path.join(os.homedir(), '.local', 'bin');
                if (!fs.existsSync(localBin)) {
                    fs.mkdirSync(localBin, { recursive: true });
                }
                cliTarget = path.join(localBin, 'devlog');
                fs.writeFileSync(cliTarget, wrapperScript);
                fs.chmodSync(cliTarget, 0o755);

                // Show message about adding to PATH
                if (mainWindow) {
                    dialog.showMessageBox(mainWindow, {
                        type: 'info',
                        title: 'CLI Installed',
                        message: 'CLI installed to ~/.local/bin',
                        detail: 'Add ~/.local/bin to your PATH if it\'s not already there:\n\nexport PATH="$HOME/.local/bin:$PATH"',
                    });
                }
                return true;
            }
        } else if (platform === 'win32') {
            // Windows: Install to user's local bin directory
            const localBin = path.join(
                os.homedir(),
                'AppData',
                'Local',
                'devlog',
            );
            if (!fs.existsSync(localBin)) {
                fs.mkdirSync(localBin, { recursive: true });
            }

            cliTarget = path.join(localBin, 'devlog.bat');
            const batchScript = `@echo off\nnode "${cliSource}" %*\n`;
            fs.writeFileSync(cliTarget, batchScript);

            // Try to add to user PATH (doesn't require admin)
            try {
                const currentPath = process.env.PATH || '';
                if (!currentPath.includes(localBin)) {
                    execSync(`setx PATH "${currentPath};${localBin}"`, {
                        stdio: 'ignore',
                    });
                }
            } catch {
                // If setx fails, show instructions
                if (mainWindow) {
                    dialog.showMessageBox(mainWindow, {
                        type: 'info',
                        title: 'CLI Installed',
                        message: 'CLI installed',
                        detail: `Add this to your PATH:\n${localBin}`,
                    });
                }
            }
            return true;
        } else {
            // Linux: Similar to macOS
            const localBin = path.join(os.homedir(), '.local', 'bin');
            if (!fs.existsSync(localBin)) {
                fs.mkdirSync(localBin, { recursive: true });
            }

            cliTarget = path.join(localBin, 'devlog');
            const wrapperScript = `#!/bin/bash\nexec node "${cliSource}" "$@"\n`;
            fs.writeFileSync(cliTarget, wrapperScript);
            fs.chmodSync(cliTarget, 0o755);

            if (mainWindow) {
                dialog.showMessageBox(mainWindow, {
                    type: 'info',
                    title: 'CLI Installed',
                    message: 'CLI installed to ~/.local/bin',
                    detail: 'Add ~/.local/bin to your PATH if it\'s not already there:\n\nexport PATH="$HOME/.local/bin:$PATH"',
                });
            }
            return true;
        }
    } catch (err) {
        console.error('Failed to install CLI:', err);
        return false;
    }
}

// Disable GPU acceleration issues in development
if (process.env.NODE_ENV === 'development') {
    app.commandLine.appendSwitch('--disable-gpu');
    app.commandLine.appendSwitch('--disable-software-rasterizer');
    app.commandLine.appendSwitch('--disable-gpu-compositing');
    app.commandLine.appendSwitch('--disable-gpu-rasterization');
    app.commandLine.appendSwitch('--disable-gpu-sandbox');
    app.commandLine.appendSwitch('--no-sandbox');
}

app.whenReady().then(async () => {
    // Initialize SQLite database
    initializeDatabase();

    // Migrate existing JSON data to SQLite if it exists
    // try {
    //     const { migrateFromJSON } = await import('./db/migrate-from-json');
    //     const result = migrateFromJSON();
    //     if (result.success) {
    //         console.log('Migration:', result.message);
    //     } else {
    //         console.error('Migration failed:', result.message);
    //     }
    // } catch (error) {
    //     console.error('Migration error:', error);
    // }

    // Try to install CLI on first launch if not already installed
    if (!isCliInstalled() && !hasAttemptedInstallation()) {
        markInstallationAttempted();
        const installed = await installCli();
        if (installed && mainWindow) {
            // Small delay to ensure window is ready
            setTimeout(() => {
                if (mainWindow) {
                    dialog.showMessageBox(mainWindow, {
                        type: 'info',
                        title: 'CLI Installed',
                        message: 'Command-line interface installed!',
                        detail: 'You can now use "devlog ci" and "devlog co" from your terminal.',
                    });
                }
            }, 1000);
        }
    }

    createWindow();
    createTray();
    // Don't start background tray updates - React handles this now
    // startTrayTimerUpdate();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    // On macOS, keep app running in menubar even when window is closed
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    stopTrayTimerUpdate();
    closeDatabase();
});

// IPC handlers

// Legacy compatibility - these will be deprecated
ipcMain.handle('get-last-entry', (): WorkLogEntry | null => {
    const logs = dbHandlers.getAllWorkLogs();
    return logs.length > 0 ? logs[logs.length - 1] : null;
});

ipcMain.handle(
    'clock-out',
    async (_event, workDescription: string): Promise<{ success: boolean }> => {
        const now = new Date();

        dbHandlers.createWorkLog({
            date: now.toISOString().split('T')[0],
            description: workDescription || 'No description provided',
            tags: [],
            startTime: now.toTimeString().substring(0, 5),
        });

        // Lock computer after saving
        lockComputer();

        return { success: true };
    },
);

ipcMain.handle(
    'clock-in',
    (): { success: boolean; lastWorkDescription: string | null } => {
        const now = new Date();

        dbHandlers.createWorkLog({
            date: now.toISOString().split('T')[0],
            description: 'Clocked in',
            tags: [],
            startTime: now.toTimeString().substring(0, 5),
        });

        // Get the last work log entry to show what was worked on
        const logs = dbHandlers.getAllWorkLogs();
        const lastEntry = logs.length >= 2 ? logs[logs.length - 2] : null;

        return {
            success: true,
            lastWorkDescription: lastEntry
                ? lastEntry.description || null
                : null,
        };
    },
);

ipcMain.handle('get-all-entries', (): WorkLogEntry[] => {
    return dbHandlers.getAllWorkLogs();
});

// New comprehensive API
ipcMain.handle('getAppData', (): AppData => {
    return dbHandlers.getAllAppData();
});

ipcMain.handle(
    'saveAppData',
    (_event, partialData: Partial<AppData>): boolean => {
        try {
            if (partialData.activeTimer !== undefined) {
                dbHandlers.setActiveTimer(partialData.activeTimer ?? null);
            }
            if (partialData.settings) {
                dbHandlers.updateSettings(partialData.settings);
            }
            return true;
        } catch (_error) {
            return false;
        }
    },
);

// Work Logs
ipcMain.handle(
    'createWorkLog',
    (_event, entry: Omit<WorkLogEntry, 'id' | 'timestamp'>): { id: string } => {
        return dbHandlers.createWorkLog(entry);
    },
);

ipcMain.handle(
    'updateWorkLog',
    (_event, id: string, updates: Partial<WorkLogEntry>): boolean => {
        try {
            dbHandlers.updateWorkLog(id, updates);
            return true;
        } catch (_error) {
            return false;
        }
    },
);

ipcMain.handle('deleteWorkLog', (_event, id: string): boolean => {
    try {
        dbHandlers.deleteWorkLog(id);
        return true;
    } catch (_error) {
        return false;
    }
});

// Todos
ipcMain.handle(
    'createTodo',
    (
        _event,
        todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>,
    ): { id: string } => {
        return dbHandlers.createTodo(todo);
    },
);

ipcMain.handle(
    'updateTodo',
    (_event, id: string, updates: Partial<Todo>): boolean => {
        try {
            dbHandlers.updateTodo(id, updates);
            return true;
        } catch (_error) {
            return false;
        }
    },
);

ipcMain.handle('deleteTodo', (_event, id: string): boolean => {
    try {
        dbHandlers.deleteTodo(id);
        return true;
    } catch (_error) {
        return false;
    }
});

// Notes
ipcMain.handle(
    'createNote',
    (
        _event,
        note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>,
    ): { id: string } => {
        return dbHandlers.createNote(note);
    },
);

ipcMain.handle(
    'updateNote',
    (_event, id: string, updates: Partial<Note>): boolean => {
        try {
            dbHandlers.updateNote(id, updates);
            return true;
        } catch (_error) {
            return false;
        }
    },
);

ipcMain.handle('deleteNote', (_event, id: string): boolean => {
    try {
        dbHandlers.deleteNote(id);
        return true;
    } catch (_error) {
        return false;
    }
});

// Habits
ipcMain.handle(
    'createHabit',
    (
        _event,
        habit: Omit<
            Habit,
            'id' | 'streak' | 'longestStreak' | 'createdAt' | 'updatedAt'
        >,
    ): { id: string } => {
        return dbHandlers.createHabit({
            name: habit.name,
            description: habit.description,
            frequency: 'daily' as const, // Default to daily
            targetCount: 1,
            color: '#8b5cf6',
            icon: 'target',
        });
    },
);

ipcMain.handle(
    'updateHabit',
    (_event, id: string, updates: Partial<Habit>): boolean => {
        try {
            dbHandlers.updateHabit(id, updates);
            return true;
        } catch (_error) {
            return false;
        }
    },
);

ipcMain.handle('deleteHabit', (_event, id: string): boolean => {
    try {
        dbHandlers.deleteHabit(id);
        return true;
    } catch (_error) {
        return false;
    }
});

ipcMain.handle('completeHabit', (_event, id: string): boolean => {
    try {
        const habits = dbHandlers.getAllHabits();
        const habit = habits.find((h) => h.id === id);
        if (!habit) return false;

        const today = new Date().toISOString().split('T')[0];

        if (habit.completedDates.includes(today)) {
            // Already completed today
            return true;
        }

        const updatedDates = [...habit.completedDates, today];
        dbHandlers.updateHabit(id, { completedDates: updatedDates });
        return true;
    } catch (_error) {
        return false;
    }
});

// Pomodoro
ipcMain.handle(
    'createPomodoroSession',
    (_event, session: Omit<PomodoroSession, 'id'>): { id: string } => {
        return dbHandlers.createPomodoroSession(session);
    },
);

ipcMain.handle(
    'updatePomodoroSession',
    (_event, id: string, updates: Partial<PomodoroSession>): boolean => {
        try {
            dbHandlers.updatePomodoroSession(id, updates);
            return true;
        } catch (_error) {
            return false;
        }
    },
);

// Settings
ipcMain.handle('getSettings', (): AppSettings => {
    return dbHandlers.getSettings();
});

ipcMain.handle(
    'updateSettings',
    (_event, settings: Partial<AppSettings>): boolean => {
        try {
            dbHandlers.updateSettings(settings);
            return true;
        } catch (_error) {
            return false;
        }
    },
);

// Tray and notifications
ipcMain.handle('playNotificationSound', (): void => {
    // Play system beep sound
    if (process.platform === 'darwin') {
        exec('afplay /System/Library/Sounds/Glass.aiff');
    } else if (process.platform === 'win32') {
        exec('rundll32 user32.dll,MessageBeep');
    } else {
        // Linux
        exec(
            'paplay /usr/share/sounds/freedesktop/stereo/complete.oga || beep',
        );
    }
});

ipcMain.handle(
    'updateTrayTimer',
    (_event, timerState?: ActiveTimerState | null): void => {
        updateTrayMenu(timerState);
    },
);
