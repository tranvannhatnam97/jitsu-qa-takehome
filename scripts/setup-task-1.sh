#!/usr/bin/env bash
# Install dependencies for Task I (web).
# Idempotent — re-running is safe.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
cd "$ROOT/task-1-web"

echo "==> task-1-web: installing node dependencies"
npm install

echo "==> task-1-web: installing Chromium for Playwright"
npx playwright install chromium

echo
echo "OK — Task I is ready. Run it with:"
echo "  sh scripts/run-task-1.sh"
