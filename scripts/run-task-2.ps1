#Requires -Version 5.1
# Run Task II (API) end-to-end and build the Allure report.
# Override the org with: $env:GITHUB_ORG = 'playwright'; .\scripts\run-task-2.ps1
$ErrorActionPreference = 'Stop'

$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Resolve-Path (Join-Path $Here '..')
. (Join-Path $Here '_env.ps1')
Set-Location (Join-Path $Root 'task-2-api')

$org = if ($env:GITHUB_ORG) { $env:GITHUB_ORG } else { 'SeleniumHQ' }
Write-Host "==> task-2-api: running spec (org=$org)"
npm test

if ((Test-Path 'allure-results') -and (Get-Command java -ErrorAction SilentlyContinue)) {
    Write-Host "==> task-2-api: generating Allure report"
    npx allure generate allure-results --clean -o allure-report | Out-Null
    Write-Host "    Allure report:    task-2-api\allure-report\index.html"
    Write-Host "    Open in browser:  cd task-2-api; npx allure open allure-report"
} else {
    Write-Host "    (skipping Allure: Java not found on PATH)"
}
Write-Host "    Playwright HTML:  task-2-api\playwright-report\index.html"
