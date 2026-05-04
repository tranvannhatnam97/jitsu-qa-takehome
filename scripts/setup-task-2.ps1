#Requires -Version 5.1
# Install dependencies for Task II (API).
$ErrorActionPreference = 'Stop'

$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Resolve-Path (Join-Path $Here '..')
Set-Location (Join-Path $Root 'task-2-api')

Write-Host "==> task-2-api: installing node dependencies"
npm install

Write-Host ""
Write-Host "OK -- Task II is ready. Run it with:"
Write-Host "  powershell -File scripts\run-task-2.ps1"
