#!/usr/bin/env bash
# Provision the full mobile toolchain: JDK 17 + Android SDK 34 + ARM64 system
# image + emulator + AVD `jitsu_test` + Appium 2 + uiautomator2 driver.
# Designed for Apple Silicon macOS. Re-running is safe — every step is gated
# on whether the artefact already exists.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"

command -v brew >/dev/null 2>&1 || {
  echo "ERROR: Homebrew is required. Install from https://brew.sh and re-run."
  exit 1
}

echo "==> jdk: openjdk@17"
brew list --formula 2>/dev/null | grep -qx 'openjdk@17' || brew install openjdk@17

echo "==> sdk: android command-line tools"
brew list --cask 2>/dev/null | grep -qx 'android-commandlinetools' \
  || brew install --cask android-commandlinetools

# shellcheck disable=SC1091
source "$HERE/_env.sh"
mkdir -p "$ANDROID_HOME"

echo "==> sdk: accepting licenses"
yes 2>/dev/null | sdkmanager --licenses --sdk_root="$ANDROID_HOME" >/dev/null || true

echo "==> sdk: installing components (~3-4 GB on first run)"
sdkmanager --sdk_root="$ANDROID_HOME" \
  "cmdline-tools;latest" \
  "platform-tools" \
  "platforms;android-34" \
  "build-tools;34.0.0" \
  "emulator" \
  "system-images;android-34;google_apis;arm64-v8a" >/dev/null

# Re-source so cmdline-tools/latest/bin is on PATH if it was just installed.
# shellcheck disable=SC1091
source "$HERE/_env.sh"

if avdmanager list avd 2>/dev/null | grep -q '^[[:space:]]*Name:[[:space:]]*jitsu_test$'; then
  echo "==> avd: jitsu_test already exists — skipping"
else
  echo "==> avd: creating jitsu_test (Pixel 5, API 34, arm64-v8a)"
  echo "no" | avdmanager create avd -n jitsu_test \
    -k "system-images;android-34;google_apis;arm64-v8a" \
    --device "pixel_5" --force
fi

cd "$ROOT/task-3-mobile"
echo "==> task-3-mobile: installing node dependencies"
npm install

echo "==> task-3-mobile: installing Appium uiautomator2 driver"
if ! npx appium driver list --installed 2>/dev/null | grep -q '^[[:space:]]*-[[:space:]]*uiautomator2'; then
  npx appium driver install uiautomator2
else
  echo "    already installed"
fi

if [ ! -f apps/jitsu-driver.apk ]; then
  echo
  echo "WARNING: apps/jitsu-driver.apk is missing."
  echo "         Download the APK from the take-home Google Drive link and place it there."
fi

echo
echo "OK — Task III is ready. Run it with:"
echo "  sh scripts/run-task-3.sh"
