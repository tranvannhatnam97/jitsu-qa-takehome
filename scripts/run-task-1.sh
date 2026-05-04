#!/usr/bin/env bash
# Run Task I (web) end-to-end and build the Allure report.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
# shellcheck disable=SC1091
source "$HERE/_env.sh"
cd "$ROOT/task-1-web"

echo "==> task-1-web: running spec"
npm test

if [ -d allure-results ] && command -v java >/dev/null 2>&1; then
  echo "==> task-1-web: generating Allure report"
  npx allure generate allure-results --clean -o allure-report >/dev/null
  echo "    Allure report:    task-1-web/allure-report/index.html"
  echo "    Open in browser:  cd task-1-web && npx allure open allure-report"
else
  echo "    (skipping Allure: Java not found on PATH)"
fi
echo "    Playwright HTML:  task-1-web/playwright-report/index.html"
