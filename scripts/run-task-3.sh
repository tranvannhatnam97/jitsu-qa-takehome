#!/usr/bin/env bash
# Run Task III (mobile) end-to-end. Brings up the emulator and Appium server
# if they are not already running, runs the spec, then builds the Allure
# report (which includes the per-step screenshots and the screen recording).
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
# shellcheck disable=SC1091
source "$HERE/_env.sh"

if [ ! -f "$ROOT/task-3-mobile/apps/jitsu-driver.apk" ]; then
  echo "ERROR: task-3-mobile/apps/jitsu-driver.apk is missing."
  echo "       Download the APK from the take-home and place it there before running."
  exit 1
fi

# ── Emulator ──────────────────────────────────────────────────────────────
if adb devices 2>/dev/null | grep -q '^emulator-'; then
  echo "==> emulator: already running"
else
  echo "==> emulator: booting jitsu_test"
  nohup emulator -avd jitsu_test -no-audio -no-snapshot \
    > /tmp/jitsu-emulator.log 2>&1 &
  adb wait-for-device
  until [[ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" == "1" ]]; do
    sleep 3
  done
  echo "    booted"
fi

# ── Appium server ─────────────────────────────────────────────────────────
if curl -s http://127.0.0.1:4723/wd/hub/status >/dev/null 2>&1; then
  echo "==> appium: already running on :4723"
else
  echo "==> appium: starting on :4723"
  ( cd "$ROOT/task-3-mobile" && nohup npx appium --base-path=/wd/hub \
      > /tmp/jitsu-appium.log 2>&1 & )
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    sleep 1
    curl -s http://127.0.0.1:4723/wd/hub/status >/dev/null 2>&1 && break
  done
fi

# ── Test run ──────────────────────────────────────────────────────────────
cd "$ROOT/task-3-mobile"
echo "==> task-3-mobile: clearing app state for a clean run"
adb shell pm clear com.axlehire.drive.staging >/dev/null 2>&1 || true

echo "==> task-3-mobile: running spec"
npm test

if [ -d allure-results ]; then
  echo "==> task-3-mobile: generating Allure report"
  npx allure generate allure-results --clean -o allure-report >/dev/null
  echo "    Allure report:    task-3-mobile/allure-report/index.html"
  echo "    Open in browser:  cd task-3-mobile && npx allure open allure-report"
fi
echo "    Recording:        task-3-mobile/recordings/*.mp4"
