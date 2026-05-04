#Requires -Version 5.1
<#
Provision the mobile toolchain on Windows: JDK 17 + Android SDK 34 +
system image (auto-picks ARM64 on Windows ARM, x86_64 on x64) + emulator
+ AVD `jitsu_test` + Appium 2 + uiautomator2 driver.

Re-running is safe — every step is gated on whether the artefact already
exists.

Prerequisites:
  - winget (ships with Windows 10/11 22H2+) for JDK install, OR install
    JDK 17 manually from https://adoptium.net then re-run.
  - Hyper-V or WHPX enabled for the emulator (Settings -> Apps -> Optional
    features -> "Windows Hypervisor Platform"). On Windows running inside
    VMware Fusion, nested virtualisation must be enabled in the VM
    settings; otherwise the emulator falls back to ARM TCG (slow) or
    fails to start.
#>
$ErrorActionPreference = 'Stop'

$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Resolve-Path (Join-Path $Here '..')

# ── JDK 17 ────────────────────────────────────────────────────────────────
. (Join-Path $Here '_env.ps1')
if (-not $env:JAVA_HOME) {
    Write-Host "==> jdk: installing Microsoft OpenJDK 17 via winget"
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        throw "winget not found. Install JDK 17 manually from https://adoptium.net then re-run."
    }
    winget install --id Microsoft.OpenJDK.17 --silent --accept-package-agreements --accept-source-agreements
    . (Join-Path $Here '_env.ps1')   # re-detect JAVA_HOME
}
Write-Host "    JAVA_HOME = $env:JAVA_HOME"

# ── Android command-line tools ────────────────────────────────────────────
$cmdlineDir = Join-Path $env:ANDROID_HOME 'cmdline-tools\latest'
if (-not (Test-Path "$cmdlineDir\bin\sdkmanager.bat")) {
    Write-Host "==> sdk: downloading cmdline-tools"
    $zip = Join-Path $env:TEMP 'commandlinetools-win.zip'
    Invoke-WebRequest -Uri 'https://dl.google.com/android/repository/commandlinetools-win-13114758_latest.zip' -OutFile $zip
    $tmpExtract = Join-Path $env:TEMP 'cmdline-extract'
    if (Test-Path $tmpExtract) { Remove-Item -Recurse -Force $tmpExtract }
    Expand-Archive -Path $zip -DestinationPath $tmpExtract -Force
    New-Item -ItemType Directory -Force -Path $cmdlineDir | Out-Null
    Get-ChildItem (Join-Path $tmpExtract 'cmdline-tools') | Move-Item -Destination $cmdlineDir -Force
    Remove-Item $zip, $tmpExtract -Recurse -Force -ErrorAction SilentlyContinue
    . (Join-Path $Here '_env.ps1')
}

# ── SDK packages ──────────────────────────────────────────────────────────
$arch = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'arm64-v8a' } else { 'x86_64' }
$systemImage = "system-images;android-34;google_apis;$arch"

Write-Host "==> sdk: accepting licenses"
'y' * 20 | & sdkmanager.bat --licenses --sdk_root=$env:ANDROID_HOME 2>$null | Out-Null

Write-Host "==> sdk: installing components (~3-4 GB on first run, target=$arch)"
& sdkmanager.bat --sdk_root=$env:ANDROID_HOME `
    'platform-tools' `
    'platforms;android-34' `
    'build-tools;34.0.0' `
    'emulator' `
    $systemImage | Out-Null

# ── AVD ───────────────────────────────────────────────────────────────────
$avdList = & avdmanager.bat list avd 2>$null
if ($avdList -match 'Name:\s+jitsu_test') {
    Write-Host "==> avd: jitsu_test already exists -- skipping"
} else {
    Write-Host "==> avd: creating jitsu_test (Pixel 5, API 34, $arch)"
    'no' | & avdmanager.bat create avd -n jitsu_test -k $systemImage --device 'pixel_5' --force | Out-Null
}

# ── Project deps + Appium driver ──────────────────────────────────────────
Set-Location (Join-Path $Root 'task-3-mobile')
Write-Host "==> task-3-mobile: installing node dependencies"
npm install

Write-Host "==> task-3-mobile: installing Appium uiautomator2 driver"
$installed = npx appium driver list --installed 2>$null
if ($installed -notmatch 'uiautomator2') {
    npx appium driver install uiautomator2
} else {
    Write-Host "    already installed"
}

if (-not (Test-Path 'apps\jitsu-driver.apk')) {
    Write-Host ""
    Write-Host "WARNING: apps\jitsu-driver.apk is missing."
    Write-Host "         Download the APK from the take-home Google Drive link and place it there."
}

Write-Host ""
Write-Host "OK -- Task III is ready. Run it with:"
Write-Host "  powershell -File scripts\run-task-3.ps1"
