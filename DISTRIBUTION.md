# Code Signing & Notarization Guide

## What is "Developer ID Application"?

**Developer ID Application** is an Apple certificate used to sign macOS applications for distribution outside the Mac App Store. It:

- Verifies you as a trusted developer
- Allows users to install your app without security warnings
- Enables Gatekeeper to recognize your app as safe
- Required for notarization (Apple's security check)

## Do You Need It?

### For Personal Use (You don't need it)

- If you're only using the app yourself, you can skip code signing
- macOS may show a warning, but you can still run the app
- Right-click > Open > Click "Open" to bypass the warning

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

5. **Sign the app**

   After building with `bun run build:app`, use `codesign` to sign the resulting `.app` bundle:

   ```bash
   codesign --deep --force --options runtime \
     --sign "Developer ID Application: Your Name (TEAM_ID)" \
     build/DevLog.app
   ```

## Notarization (Optional but Recommended)

After code signing, you can notarize your app so macOS Gatekeeper trusts it without warnings:

1. **Get App-Specific Password**
   - Go to <https://appleid.apple.com>
   - Generate an app-specific password

2. **Store credentials** (one-time)

   ```bash
   xcrun notarytool store-credentials "devlog-notarize" \
     --apple-id "you@example.com" \
     --team-id "TEAM_ID" \
     --password "app-specific-password"
   ```

3. **Submit for notarization**

   ```bash
   # Create a zip of the signed app
   ditto -c -k --keepParent build/DevLog.app build/DevLog.zip

   # Submit
   xcrun notarytool submit build/DevLog.zip \
     --keychain-profile "devlog-notarize" \
     --wait

   # Staple the ticket to the app
   xcrun stapler staple build/DevLog.app
   ```

## Current Status

- Code signing is skipped for local development builds
- The app will still work, but users may see Gatekeeper warnings
- For personal use, this is fine!

## Quick Reference

- **No code signing needed for**: Personal use, development
- **Code signing needed for**: Distribution, professional apps
- **Cost**: $99/year for Apple Developer Program
- **Time**: ~30 minutes to set up

---

# App Icon Setup

## For macOS

Electrobun expects an `icon.iconset/` directory at the project root (configured in `electrobun.config.ts`).

1. Create an icon in PNG format (recommended: 1024x1024px)
2. Generate the required sizes in an `.iconset` directory:

### Using `iconutil` (macOS built-in)

```bash
mkdir -p icon.iconset

# Required sizes:
# icon_16x16.png, icon_16x16@2x.png (32x32)
# icon_32x32.png, icon_32x32@2x.png (64x64)
# icon_128x128.png, icon_128x128@2x.png (256x256)
# icon_256x256.png, icon_256x256@2x.png (512x512)
# icon_512x512.png, icon_512x512@2x.png (1024x1024)

# Use sips (macOS built-in) or ImageMagick to resize your source image:
# sips -z 16 16 source.png --out icon.iconset/icon_16x16.png
# sips -z 32 32 source.png --out icon.iconset/icon_16x16@2x.png
# ... etc.
```

Electrobun will convert the `.iconset` to `.icns` automatically during the build.

### Using online tools

- Use online converters like <https://cloudconvert.com/png-to-icns>
- Upload your 1024x1024 PNG and download the .icns file
- Extract the individual sizes into `icon.iconset/`

## For Windows (optional)

- Create `assets/icon.ico` (256x256 or 512x512 recommended)

## For Linux (optional)

- Create `assets/icon.png` (512x512 recommended)
