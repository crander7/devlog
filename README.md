# DevLog - Electron App

A modern Electron application built with TypeScript, React, Vite, and shadcn/ui for clocking in and out of work, with automatic computer locking on clock out.

## Tech Stack

- **Electron** - Desktop app framework
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **shadcn/ui** - Beautiful UI components
- **Tailwind CSS** - Styling
- **TanStack Router** - (Available for routing if needed)

## Features

- **Clock In**: Record when you start working and see what you were last working on
- **Clock Out**: Record what you were working on, save it to a file, and automatically lock your computer
- **Work History**: View your recent clock in/out entries
- **Data Persistence**: All entries are saved to a JSON file in your app data directory
- **Modern UI**: Beautiful interface built with shadcn/ui components

## Installation

1. Install dependencies:

```bash
npm install
```

## Running the App

### Command Line Interface (CLI)

The CLI is **automatically installed** when you first launch the Electron app! You'll see a notification confirming the installation.

You can use the CLI to clock in and out from the terminal with interactive prompts:

```bash
# Clock in - Shows last work session and prompts for intended work
devlog ci

# Clock out - Prompts for what you were working on
devlog co
```

**Automatic Installation:**

- On first launch, the app automatically installs the CLI to your PATH
- **macOS**: Installs to `/usr/local/bin/devlog` (or `~/.local/bin/devlog` if permissions are needed)
- **Windows**: Installs to `%LOCALAPPDATA%\devlog\devlog.bat` and adds to PATH
- **Linux**: Installs to `~/.local/bin/devlog`

**Clock In Flow:**

1. Shows your last work session (where you left off)
2. Prompts: "What do you intend to work on?"
3. If you press Enter, continues with last session's work
4. If you type something, uses that as your intended work

**Clock Out Flow:**

1. Prompts: "What were you working on?"
2. Saves your work description
3. Locks your computer

The CLI uses the same data file as the Electron app, so you can seamlessly switch between CLI and GUI.

**Development Mode:**
If you're developing, you can use npm scripts:

```bash
npm run ci  # Clock in
npm run co  # Clock out
```

### Electron App - Development Mode

```bash
npm run electron:dev
```

This will:

1. Start the Vite dev server on `http://localhost:5173`
2. Wait for the server to be ready
3. Launch Electron with DevTools open

### Production Build

```bash
npm run build
npm run electron
```

### Building for Distribution

```bash
npm run electron:build
```

## How It Works

- **Clock In**: Click the "Clock In" button to start a work session. The app will show you what you were last working on (from your previous clock out).

- **Clock Out**: Click the "Clock Out" button, enter a description of what you were working on, and click "Submit & Lock". The app will:
  1. Save your work description to a JSON file
  2. Automatically lock your computer (platform-specific)

## Data Storage

Devlog entries are stored in a JSON file located at:

- **macOS**: `~/Library/Application Support/devlog/devlog.json`
- **Windows**: `%APPDATA%/devlog/devlog.json`
- **Linux**: `~/.config/devlog/devlog.json`

## Computer Locking

The app automatically locks your computer when you clock out:

- **macOS**: Uses `pmset displaysleepnow`
- **Windows**: Uses `rundll32.exe user32.dll,LockWorkStation`
- **Linux**: Uses `gnome-screensaver-command` or `xdg-screensaver`

## Project Structure

```
devlog/
├── electron/          # Electron main process and preload scripts
│   ├── main.ts       # Main Electron process (TypeScript)
│   └── preload.ts    # Preload script for secure IPC
├── src/              # React application
│   ├── components/   # React components
│   │   └── ui/      # shadcn/ui components
│   ├── lib/         # Utility functions
│   ├── App.tsx      # Main React component
│   ├── main.tsx     # React entry point
│   └── index.css    # Global styles with Tailwind
├── index.html        # HTML template
├── vite.config.ts    # Vite configuration
├── tsconfig.json    # TypeScript configuration
└── tailwind.config.js # Tailwind CSS configuration
```

## Notes

- **TanStack Start**: This project uses React with Vite rather than TanStack Start, as TanStack Start is designed for full-stack SSR applications and isn't ideal for Electron apps. If you specifically need TanStack Start features, we can discuss alternatives or adaptations.

- **shadcn/ui**: Components are installed and ready to use. You can add more components using the shadcn CLI if needed.

## Development

The app uses:

- **TypeScript** for type safety throughout
- **Vite** for fast HMR during development
- **ESM modules** for modern JavaScript
- **Path aliases** (`@/`) for cleaner imports
