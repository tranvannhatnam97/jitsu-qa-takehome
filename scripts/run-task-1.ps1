#Requires -Version 5.1
# Run Task I (web) end-to-end and build the Allure report.
$ErrorActionPreference = 'Stop'

$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Resolve-Path (Join-Path $Here '..')
. (Join-Path $Here '_env.ps1')
Set-Location (Join-Path $Root 'task-1-web')

Write-Host "==> task-1-web: running spec"
npm test

if ((Test-Path 'allure-results') -and (Get-Command java -ErrorAction SilentlyContinue)) {
    Write-Host "==> task-1-web: generating Allure report"
    npx allure generate allure-results --clean -o allure-report | Out-Null
    Write-Host "    Allure report:    task-1-web\allure-report\index.html"
    Write-Host "    Open in browser:  cd task-1-web; npx allure open allure-report"
} else {
    Write-Host "    (skipping Allure: Java not found on PATH)"
}
Write-Host "    Playwright HTML:  task-1-web\playwright-report\index.html"
