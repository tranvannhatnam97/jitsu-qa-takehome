#Requires -Version 5.1
# Install dependencies for Task I (web). Idempotent — re-running is safe.
$ErrorActionPreference = 'Stop'

$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Resolve-Path (Join-Path $Here '..')
Set-Location (Join-Path $Root 'task-1-web')

Write-Host "==> task-1-web: installing node dependencies"
npm install

Write-Host "==> task-1-web: installing Chromium for Playwright"
npx playwright install chromium

Write-Host ""
Write-Host "OK -- Task I is ready. Run it with:"
Write-Host "  powershell -File scripts\run-task-1.ps1"
