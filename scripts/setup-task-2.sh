#!/usr/bin/env bash
# Install dependencies for Task II (API).
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
cd "$ROOT/task-2-api"

echo "==> task-2-api: installing node dependencies"
npm install

echo
echo "OK — Task II is ready. Run it with:"
echo "  sh scripts/run-task-2.sh"
