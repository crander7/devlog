#!/bin/bash

# Install DevLog CLI to PATH
# This script creates a wrapper script to run the CLI from the Electrobun app

APP_NAME="DevLog"
APP_DIR="/Applications/${APP_NAME}.app"

if [ ! -d "$APP_DIR" ]; then
    echo "❌ ${APP_NAME} app not found at $APP_DIR"
    echo "Please install the app first, then run this script."
    exit 1
fi

CLI_SOURCE="$APP_DIR/Contents/Resources/cli/cli.js"
CLI_TARGET="/usr/local/bin/devlog"

if [ ! -f "$CLI_SOURCE" ]; then
    echo "❌ CLI not found in app bundle at $CLI_SOURCE"
    echo "Make sure you've built the app with: bun run build:app"
    exit 1
fi

# Create wrapper script with shebang
cat > "$CLI_TARGET" << EOF
#!/bin/bash
exec bun "$CLI_SOURCE" "\$@"
EOF

chmod +x "$CLI_TARGET"

echo "✅ CLI installed successfully!"
echo ""
echo "You can now use:"
echo "  devlog ci    # Clock in"
echo "  devlog co    # Clock out"
echo ""
echo "The CLI is installed at: $CLI_TARGET"

