#!/usr/bin/env bash
# Run Task II (API) end-to-end and build the Allure report.
# Override the org with: GITHUB_ORG=playwright sh scripts/run-task-2.sh
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
# shellcheck disable=SC1091
source "$HERE/_env.sh"
cd "$ROOT/task-2-api"

echo "==> task-2-api: running spec (org=${GITHUB_ORG:-SeleniumHQ})"
npm test

if [ -d allure-results ] && command -v java >/dev/null 2>&1; then
  echo "==> task-2-api: generating Allure report"
  npx allure generate allure-results --clean -o allure-report >/dev/null
  echo "    Allure report:    task-2-api/allure-report/index.html"
  echo "    Open in browser:  cd task-2-api && npx allure open allure-report"
else
  echo "    (skipping Allure: Java not found on PATH)"
fi
echo "    Playwright HTML:  task-2-api/playwright-report/index.html"
