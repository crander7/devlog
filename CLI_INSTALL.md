# Installing the CLI

The DevLog CLI is **automatically installed** when you first launch the Electron app!

If automatic installation didn't work, or you need to reinstall, follow the manual instructions below.

## macOS

1. Install the DevLog app (drag to Applications folder)

2. Run the installation script:

   ```bash
   chmod +x scripts/install-cli.sh
   ./scripts/install-cli.sh
   ```

   Or manually create a symlink:

   ```bash
   sudo ln -s "/Applications/DevLog.app/Contents/Resources/cli/cli.js" /usr/local/bin/devlog
   sudo chmod +x /usr/local/bin/devlog
   ```

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
   - Create `C:\Program Files\devlog\devlog.bat`:

     ```batch
     @echo off
     node "C:\Program Files\DevLog\resources\cli\cli.js" %*
     ```

   - Add `C:\Program Files\devlog` to your PATH

3. Restart your terminal and verify:

   ```cmd
   devlog help
   ```

## Linux

1. Install the DevLog app

2. Create a symlink:

   ```bash
   sudo ln -s "/opt/devlog/resources/cli/cli.js" /usr/local/bin/devlog
   sudo chmod +x /usr/local/bin/devlog
   ```

3. Verify installation:

   ```bash
   devlog help
   ```

## Development Mode

If you're developing and want to use the CLI without installing:

```bash
# Using npm scripts (requires tsx)
npm run ci
npm run co

# Or directly with tsx
npx tsx src/cli.ts ci
npx tsx src/cli.ts co
```

## Notes

- The CLI uses the same data file as the Electron app
- You can switch between CLI and GUI seamlessly
- The CLI requires Node.js to be installed on your system
