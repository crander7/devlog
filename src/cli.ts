#!/usr/bin/env bun

import { Database } from 'bun:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import readline from 'node:readline';

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

const db = new Database(getDbPath());
db.exec('PRAGMA journal_mode = WAL;');

db.exec(`
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
`);

function lockComputer(): void {
    const platform = process.platform;

    if (platform === 'darwin') {
        Bun.spawn([
            'osascript',
            '-e',
            'tell application "System Events" to keystroke "q" using {control down, command down}',
        ]);
    } else if (platform === 'win32') {
        Bun.spawn(['rundll32.exe', 'user32.dll,LockWorkStation']);
    } else if (platform === 'linux') {
        Bun.spawn([
            'bash',
            '-c',
            'gnome-screensaver-command -l || xdg-screensaver lock',
        ]);
    }
}

function promptInput(question: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

function getLastWorkLog(): { description: string } | null {
    const row = db
        .prepare(
            'SELECT description FROM work_logs ORDER BY created_at DESC LIMIT 1',
        )
        .get() as { description: string } | null;
    return row ?? null;
}

async function clockIn(): Promise<void> {
    const now = new Date();
    const lastLog = getLastWorkLog();

    if (lastLog?.description) {
        console.log('📝 Last work session:', lastLog.description);
        console.log('');
    } else {
        console.log('📝 No previous work session found.');
        console.log('');
    }

    let intendedWork = '';
    if (lastLog?.description) {
        const answer = await promptInput(
            `What do you intend to work on? (Enter to continue with "${lastLog.description}"): `,
        );
        intendedWork = answer || lastLog.description;
    } else {
        intendedWork = await promptInput('What do you intend to work on? ');
    }

    const id = crypto.randomUUID();
    const date = now.toISOString().split('T')[0];
    const startTime = now.toTimeString().substring(0, 5);

    db.prepare(
        `INSERT INTO work_logs (id, date, description, tags, start_time, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(id, date, intendedWork, '[]', startTime, now.getTime());

    console.log('');
    console.log('✅ Clocked in at', now.toLocaleString());
    console.log('🎯 Intended work:', intendedWork);
}

async function clockOut(): Promise<void> {
    const now = new Date();

    const workDescription = await promptInput('What were you working on? ');

    if (!workDescription.trim()) {
        console.log('❌ Work description is required. Clock out cancelled.');
        process.exit(1);
    }

    const id = crypto.randomUUID();
    const date = now.toISOString().split('T')[0];
    const endTime = now.toTimeString().substring(0, 5);

    db.prepare(
        `INSERT INTO work_logs (id, date, description, tags, end_time, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(id, date, workDescription.trim(), '[]', endTime, now.getTime());

    console.log('');
    console.log('✅ Clocked out at', now.toLocaleString());
    console.log('📝 Work description:', workDescription.trim());
    console.log('🔒 Locking computer...');

    lockComputer();
}

function showHelp(): void {
    console.log(`
DevLog CLI - Clock in and out of work

Usage:
  bun run ci              Clock in (will prompt for intended work)
  bun run co              Clock out (will prompt for work description)
  bun run cli help        Show this help message

Examples:
  bun run ci              # Clock in, see last session, enter new work
  bun run co              # Clock out, enter what you were working on

The CLI uses the same SQLite database as the DevLog app, so you can switch
between CLI and GUI seamlessly.

When clocking in:
  - Shows your last work session
  - Prompts for what you intend to work on
  - If you press Enter, continues with last session's work

When clocking out:
  - Prompts for what you were working on
  - Locks your computer after saving
`);
}

const command = process.argv[2];

(async () => {
    switch (command) {
        case 'ci':
        case 'clock-in':
            await clockIn();
            break;

        case 'co':
        case 'clock-out':
            await clockOut();
            break;

        case 'help':
        case '--help':
        case '-h':
            showHelp();
            break;

        default:
            if (!command) {
                showHelp();
            } else {
                console.error(`Unknown command: ${command}`);
                console.log('Run "bun run cli help" for usage information.');
                process.exit(1);
            }
    }

    db.close();
})();
