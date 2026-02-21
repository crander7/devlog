#!/usr/bin/env node

import { exec } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';

interface WorkLogEntry {
    id?: string;
    date?: string;
    description?: string;
    tags?: string[];
    startTime?: string;
    endTime?: string;
    duration?: number;
    clockIn?: string;
    clockOut?: string;
    workDescription?: string;
    timestamp: number;
}

// Get the same data file location as Electron app
function getDataFile(): string {
    const platform = process.platform;
    let userDataPath: string;

    if (platform === 'darwin') {
        userDataPath = path.join(
            os.homedir(),
            'Library',
            'Application Support',
            'devlog',
        );
    } else if (platform === 'win32') {
        userDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'devlog');
    } else {
        userDataPath = path.join(os.homedir(), '.config', 'devlog');
    }

    if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
    }

    return path.join(userDataPath, 'devlog.json');
}

function ensureDataFile(): void {
    const dataFile = getDataFile();
    if (!fs.existsSync(dataFile)) {
        fs.writeFileSync(dataFile, JSON.stringify([], null, 2));
    }
}

function readWorkLog(): WorkLogEntry[] {
    ensureDataFile();
    const dataFile = getDataFile();
    try {
        const data = fs.readFileSync(dataFile, 'utf8');
        return JSON.parse(data);
    } catch (_error) {
        return [];
    }
}

function writeWorkLog(entries: WorkLogEntry[]): void {
    ensureDataFile();
    const dataFile = getDataFile();
    fs.writeFileSync(dataFile, JSON.stringify(entries, null, 2));
}

function lockComputer(): void {
    const platform = process.platform;

    if (platform === 'darwin') {
        exec(
            'osascript -e \'tell application "System Events" to keystroke "q" using {control down, command down}\'',
            (error) => {
                if (error) {
                    console.error('Error locking computer:', error.message);
                }
            },
        );
    } else if (platform === 'win32') {
        exec('rundll32.exe user32.dll,LockWorkStation', (error) => {
            if (error) {
                console.error('Error locking computer:', error.message);
            }
        });
    } else if (platform === 'linux') {
        exec(
            'gnome-screensaver-command -l || xdg-screensaver lock',
            (error) => {
                if (error) {
                    console.error('Error locking computer:', error.message);
                }
            },
        );
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

async function clockIn(): Promise<void> {
    const entries = readWorkLog();
    const now = new Date();

    // Get the last clock out entry to show what was worked on
    const lastClockOut = entries.filter((e) => e.clockOut).slice(-1)[0];

    // Show where they left off
    if (lastClockOut?.workDescription) {
        console.log('📝 Last work session:', lastClockOut.workDescription);
        console.log('');
    } else {
        console.log('📝 No previous work session found.');
        console.log('');
    }

    // Prompt for what they intend to work on
    let intendedWork = '';
    if (lastClockOut?.workDescription) {
        const answer = await promptInput(
            `What do you intend to work on? (Enter to continue with "${lastClockOut.workDescription}"): `,
        );
        intendedWork = answer || lastClockOut.workDescription;
    } else {
        intendedWork = await promptInput('What do you intend to work on? ');
    }

    const newEntry: WorkLogEntry = {
        clockIn: now.toISOString(),
        workDescription: intendedWork, // Store intended work with clock in
        timestamp: now.getTime(),
    };

    entries.push(newEntry);
    writeWorkLog(entries);

    console.log('');
    console.log('✅ Clocked in at', now.toLocaleString());
    console.log('🎯 Intended work:', intendedWork);
}

async function clockOut(): Promise<void> {
    const entries = readWorkLog();
    const now = new Date();

    // Prompt for what they were working on
    const workDescription = await promptInput('What were you working on? ');

    if (!workDescription.trim()) {
        console.log('❌ Work description is required. Clock out cancelled.');
        process.exit(1);
    }

    const newEntry: WorkLogEntry = {
        clockOut: now.toISOString(),
        workDescription: workDescription.trim(),
        timestamp: now.getTime(),
    };

    // If there's a previous entry without a clock out, update it
    if (entries.length > 0 && !entries[entries.length - 1].clockOut) {
        entries[entries.length - 1] = {
            ...entries[entries.length - 1],
            ...newEntry,
        };
    } else {
        entries.push(newEntry);
    }

    writeWorkLog(entries);

    console.log('');
    console.log('✅ Clocked out at', now.toLocaleString());
    console.log('📝 Work description:', newEntry.workDescription);
    console.log('🔒 Locking computer...');

    // Lock computer after saving
    lockComputer();
}

function showHelp(): void {
    console.log(`
DevLog CLI - Clock in and out of work

Usage:
  npm run ci              Clock in (will prompt for intended work)
  npm run co              Clock out (will prompt for work description)
  npm run cli help        Show this help message

Examples:
  npm run ci              # Clock in, see last session, enter new work
  npm run co              # Clock out, enter what you were working on

The CLI uses the same data file as the Electron app, so you can switch
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

// Main CLI logic
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
                console.log('Run "npm run cli help" for usage information.');
                process.exit(1);
            }
    }
})();
