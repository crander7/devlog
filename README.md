# DevLog

A modern desktop application built with Electrobun (Bun runtime), React, and shadcn/ui for tracking work sessions, todos, notes, habits, and pomodoro focus time.

## Tech Stack

- **Electrobun** - Lightweight desktop app framework (Bun runtime + native webview)
- **Bun** - JavaScript/TypeScript runtime
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Frontend build tool
- **shadcn/ui** - UI component library (Radix + Tailwind)
- **Tailwind CSS** - Styling
- **TanStack Router** - Client-side routing
- **Drizzle ORM** - SQLite database (via `bun:sqlite`)
- **Tiptap** - Rich text editor

## Features

- **Work Log**: Clock in/out, track work sessions with descriptions and tags
- **Todos**: Task management with priorities, due dates, and tags
- **Notes**: Rich text notes with pinning and search
- **Habits**: Daily/weekly/monthly habit tracking
- **Pomodoro Timer**: Focus sessions with configurable intervals, system tray integration
- **Dashboard**: Overview of today's productivity
- **Statistics**: Weekly breakdown and habit performance
- **System Tray**: Timer display in menubar
- **CLI**: Terminal-based clock in/out that shares the same database
- **Dark Mode**: Full theme support

## Download

Pre-built `.dmg` for macOS (Apple Silicon) is available on the [Releases](https://github.com/crander7/devlog/releases) page.

> **macOS note:** This app is not code-signed. After mounting the `.dmg` and dragging to Applications, run `xattr -cr /Applications/DevLog.app` or `xattr -cr /Applications/DevLog-canary.app` in Terminal before opening. Depending on which version you downloaded.

## Installation (from source)

```bash
bun install
```

## Running the App

### Development (with HMR)

For live UI updates in one terminal, run:

```bash
# Ensure the app is built once (only needed first time or after clean)
bun run dev:build

# Then run Vite + Electrobun in parallel (single terminal, HMR)
bun run dev:hmr
```

`dev:hmr` uses `npm-run-all2` to run the Vite dev server and Electrobun in parallel; the app window loads from `http://localhost:5173` and hot-reloads on save.

Alternatively, use two terminals: `bun run dev:vite` in one, then `USE_VITE_DEV=1 bun run dev:electrobun` in the other.

Note: `bun run dev` builds the frontend and runs the app using the **bundled** UI (no Vite server). Use `dev:hmr` when you want live UI updates.

Or build once and run (first run downloads Electrobun core binaries and builds the app bundle; later runs are quicker):

```bash
bun run dev
```

### Production Build

```bash
bun run build:app
```

This builds the React frontend with Vite, then packages everything with Electrobun into a ~14MB native app.

### CLI

The CLI uses the same SQLite database as the GUI:

```bash
# Clock in
bun run ci

# Clock out
bun run co

# Help
bun run cli help
```

## Data Storage

Data is stored in a SQLite database at:

- **macOS**: `~/Library/Application Support/devlog/devlog.db`
- **Windows**: `%APPDATA%/devlog/devlog.db`
- **Linux**: `~/.config/devlog/devlog.db`

## Project Structure

```
devlog/
├── src/
│   ├── bun/               # Electrobun main process
│   │   ├── index.ts       # Window, tray, RPC handlers
│   │   └── db/            # Database layer
│   │       ├── schema.ts          # Drizzle ORM schema
│   │       ├── index.ts           # DB init (bun:sqlite)
│   │       ├── handlers.ts        # CRUD operations
│   │       └── migrate-from-json.ts # Legacy JSON→SQLite migration
│   ├── shared/
│   │   └── rpc-types.ts   # Typed RPC schema (shared between bun & view)
│   ├── components/        # React components
│   │   └── ui/            # shadcn/ui primitives
│   ├── routes/            # TanStack Router pages
│   ├── lib/
│   │   ├── api.ts         # Frontend RPC wrapper
│   │   └── utils.ts       # Utilities
│   ├── main.tsx           # React entry point
│   └── cli.ts             # CLI tool
├── electrobun.config.ts   # Electrobun build config
├── vite.config.ts         # Vite config (frontend only)
├── tailwind.config.js     # Tailwind CSS config
└── biome.json             # Linter/formatter config
```
