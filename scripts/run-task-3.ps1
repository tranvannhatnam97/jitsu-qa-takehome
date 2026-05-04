#Requires -Version 5.1
# Run Task III (mobile) end-to-end. Boots the emulator and Appium server
# if not already running, runs the spec, then builds the Allure report
# (which includes per-step screenshots and the screen recording).
$ErrorActionPreference = 'Stop'

$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Resolve-Path (Join-Path $Here '..')
. (Join-Path $Here '_env.ps1')

$apk = Join-Path $Root 'task-3-mobile\apps\jitsu-driver.apk'
if (-not (Test-Path $apk)) {
    throw "task-3-mobile\apps\jitsu-driver.apk is missing. Download the APK from the take-home and place it there before running."
}

# ── Emulator ──────────────────────────────────────────────────────────────
$devices = & adb.exe devices 2>$null
if ($devices -match '^emulator-') {
    Write-Host "==> emulator: already running"
} else {
    Write-Host "==> emulator: booting jitsu_test"
    Start-Process -FilePath 'emulator.exe' `
        -ArgumentList @('-avd','jitsu_test','-no-audio','-no-snapshot') `
        -RedirectStandardOutput "$env:TEMP\jitsu-emulator.log" `
        -RedirectStandardError "$env:TEMP\jitsu-emulator.err" `
        -NoNewWindow
    & adb.exe wait-for-device
    do {
        Start-Sleep -Seconds 3
        $booted = (& adb.exe shell getprop sys.boot_completed 2>$null).Trim()
    } while ($booted -ne '1')
    Write-Host "    booted"
}

# ── Appium server ─────────────────────────────────────────────────────────
$appiumUp = $false
try {
    $resp = Invoke-WebRequest -Uri 'http://127.0.0.1:4723/wd/hub/status' -UseBasicParsing -TimeoutSec 2
    if ($resp.StatusCode -eq 200) { $appiumUp = $true }
} catch { }

if ($appiumUp) {
    Write-Host "==> appium: already running on :4723"
} else {
    Write-Host "==> appium: starting on :4723"
    Push-Location (Join-Path $Root 'task-3-mobile')
    Start-Process -FilePath 'cmd.exe' `
        -ArgumentList @('/c','npx appium --base-path=/wd/hub') `
        -RedirectStandardOutput "$env:TEMP\jitsu-appium.log" `
        -RedirectStandardError "$env:TEMP\jitsu-appium.err" `
        -WindowStyle Hidden
    Pop-Location
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Seconds 1
        try {
            $r = Invoke-WebRequest -Uri 'http://127.0.0.1:4723/wd/hub/status' -UseBasicParsing -TimeoutSec 2
            if ($r.StatusCode -eq 200) { break }
        } catch { }
    }
}

# ── Test run ──────────────────────────────────────────────────────────────
Set-Location (Join-Path $Root 'task-3-mobile')
Write-Host "==> task-3-mobile: clearing app state for a clean run"
& adb.exe shell pm clear com.axlehire.drive.staging 2>$null | Out-Null

Write-Host "==> task-3-mobile: running spec"
npm test

if (Test-Path 'allure-results') {
    Write-Host "==> task-3-mobile: generating Allure report"
    npx allure generate allure-results --clean -o allure-report | Out-Null
    Write-Host "    Allure report:    task-3-mobile\allure-report\index.html"
    Write-Host "    Open in browser:  cd task-3-mobile; npx allure open allure-report"
}
Write-Host "    Recording:        task-3-mobile\recordings\*.mp4"
