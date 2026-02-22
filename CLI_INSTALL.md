# Installing the CLI

The DevLog CLI is **automatically installed** when you first launch the Electrobun app!

If automatic installation didn't work, or you need to reinstall, follow the manual instructions below.

## macOS

1. Install the DevLog app (drag to Applications folder)

2. Run the installation script:

   ```bash
   chmod +x scripts/install-cli.sh
   ./scripts/install-cli.sh
   ```

   Or manually create a wrapper script:

   ```bash
   mkdir -p ~/.local/bin
   cat > ~/.local/bin/devlog << 'EOF'
   #!/bin/bash
   exec bun "/Applications/DevLog.app/Contents/Resources/cli/cli.js" "$@"
   EOF
   chmod +x ~/.local/bin/devlog
   ```

   Make sure `~/.local/bin` is on your PATH.

3. Verify installation:

   ```bash
   devlog help
   ```

## Windows

1. Install the DevLog app

2. Run PowerShell as Administrator:

   ```powershell
   .\scripts\install-cli.ps1
   ```

   Or manually:
   - Create a directory (e.g. `%LOCALAPPDATA%\devlog`)
   - Create `devlog.bat` inside it:

     ```batch
     @echo off
     bun "%APPDATA%\devlog\cli.js" %*
     ```

   - Add that directory to your PATH

3. Restart your terminal and verify:

   ```cmd
   devlog help
   ```

## Linux

1. Install the DevLog app

2. Create a wrapper script:

   ```bash
   mkdir -p ~/.local/bin
   cat > ~/.local/bin/devlog << 'EOF'
   #!/bin/bash
   exec bun "$HOME/.config/devlog/cli.js" "$@"
   EOF
   chmod +x ~/.local/bin/devlog
   ```

   Make sure `~/.local/bin` is on your PATH.

3. Verify installation:

   ```bash
   devlog help
   ```

## Development Mode

If you're developing and want to use the CLI without installing:

```bash
# Using bun scripts
bun run ci
bun run co

# Or directly
bun src/cli.ts ci
bun src/cli.ts co
```

## Notes

- The CLI uses the same SQLite database as the Electrobun app
- You can switch between CLI and GUI seamlessly
- The CLI requires [Bun](https://bun.sh) to be installed on your system
