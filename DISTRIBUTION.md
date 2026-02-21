# Code Signing & Notarization Guide

## What is "Developer ID Application"?

**Developer ID Application** is an Apple certificate used to sign macOS applications for distribution outside the Mac App Store. It:

- ✅ Verifies you as a trusted developer
- ✅ Allows users to install your app without security warnings
- ✅ Enables Gatekeeper to recognize your app as safe
- ✅ Required for notarization (Apple's security check)

## Do You Need It?

### For Personal Use (You don't need it)

- If you're only using the app yourself, you can skip code signing
- macOS may show a warning, but you can still run the app
- Right-click → Open → Click "Open" to bypass the warning

### For Distribution (You need it)

- If sharing with others, code signing is highly recommended
- Without it, users will see scary security warnings
- Required for notarization (needed for macOS 10.15+)

## How to Get a Developer ID Certificate

1. **Join Apple Developer Program** ($99/year)
   - Go to <https://developer.apple.com/programs/>
   - Sign up or log in

2. **Create Certificate Signing Request (CSR)**

   ```bash
   # Open Keychain Access
   # Menu: Keychain Access > Certificate Assistant > Request a Certificate from a Certificate Authority
   # Enter your email, choose "Saved to disk"
   ```

3. **Create Certificate in Apple Developer Portal**
   - Go to <https://developer.apple.com/account/resources/certificates/list>
   - Click "+" to create new certificate
   - Choose "Developer ID Application"
   - Upload your CSR file
   - Download the certificate

4. **Install Certificate**
   - Double-click the downloaded `.cer` file
   - It will be added to your Keychain

5. **Configure electron-builder**
   Add to `package.json`:

   ```json
   "build": {
     "mac": {
       "identity": "Developer ID Application: Your Name (TEAM_ID)"
     }
   }
   ```

## Notarization (Optional but Recommended)

After code signing, you can notarize your app:

1. **Get App-Specific Password**
   - Go to <https://appleid.apple.com>
   - Generate app-specific password

2. **Configure electron-builder**

   ```json
   "build": {
     "mac": {
       "hardenedRuntime": true,
       "gatekeeperAssess": false,
       "entitlements": "build/entitlements.mac.plist",
       "entitlementsInherit": "build/entitlements.mac.plist"
     },
     "afterSign": "scripts/notarize.js"
   }
   ```

3. **Create notarize script** (see electron-builder docs for full example)

## Current Status

Your build shows:

- ⚠️ Code signing skipped (no Developer ID found)
- ✅ App will still work, but users may see warnings
- ✅ For personal use, this is fine!

## Quick Reference

- **No code signing needed for**: Personal use, development
- **Code signing needed for**: Distribution, professional apps
- **Cost**: $99/year for Apple Developer Program
- **Time**: ~30 minutes to set up

# App Icon Setup

## For macOS

1. Create an icon file in PNG format (recommended: 1024x1024px)
2. Convert it to `.icns` format using one of these methods:

### Method 1: Using `iconutil` (macOS built-in)

```bash
# Create an iconset directory
mkdir icon.iconset

# Create different sizes (you can use ImageMagick or any image tool)
# Required sizes:
# - icon_16x16.png
# - icon_16x16@2x.png (32x32)
# - icon_32x32.png
# - icon_32x32@2x.png (64x64)
# - icon_128x128.png
# - icon_128x128@2x.png (256x256)
# - icon_256x256.png
# - icon_256x256@2x.png (512x512)
# - icon_512x512.png
# - icon_512x512@2x.png (1024x1024)

# Convert to .icns
iconutil -c icns icon.iconset -o icon.icns
```

### Method 2: Using online tools

- Use online converters like <https://cloudconvert.com/png-to-icns>
- Upload your 1024x1024 PNG and download the .icns file

### Method 3: Using ImageMagick (if installed)

```bash
# Install ImageMagick: brew install imagemagick
# Then create all sizes and convert
```

3. Place the `icon.icns` file in the `build/` directory

## For Windows (optional)

- Create `assets/icon.ico` (256x256 or 512x512 recommended)

## For Linux (optional)

- Create `assets/icon.png` (512x512 recommended)
