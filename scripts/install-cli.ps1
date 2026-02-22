# Install DevLog CLI to PATH (Windows)
# This script creates a batch file to run the CLI

$AppName = "DevLog"
$AppPath = "${env:ProgramFiles}\${AppName}\${AppName}.exe"
$CliSource = "${env:ProgramFiles}\${AppName}\resources\cli\cli.js"
$CliTarget = "${env:ProgramFiles}\devlog\devlog.bat"

if (-not (Test-Path $AppPath)) {
    Write-Host "❌ ${AppName} app not found at $AppPath" -ForegroundColor Red
    Write-Host "Please install the app first, then run this script."
    exit 1
}

if (-not (Test-Path $CliSource)) {
    Write-Host "❌ CLI not found in app bundle at $CliSource" -ForegroundColor Red
    exit 1
}

# Create directory for CLI
New-Item -ItemType Directory -Force -Path "${env:ProgramFiles}\devlog" | Out-Null

# Create batch file
@"
@echo off
bun "$CliSource" %*
"@ | Out-File -FilePath $CliTarget -Encoding ASCII

# Add to PATH (requires admin)
$Path = [Environment]::GetEnvironmentVariable("Path", "Machine")
if ($Path -notlike "*${env:ProgramFiles}\devlog*") {
    [Environment]::SetEnvironmentVariable("Path", "$Path;${env:ProgramFiles}\devlog", "Machine")
    Write-Host "✅ Added to PATH (requires restart or new terminal)" -ForegroundColor Yellow
}

Write-Host "✅ CLI installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now use:"
Write-Host "  devlog ci    # Clock in"
Write-Host "  devlog co    # Clock out"




