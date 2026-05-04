#!/usr/bin/env bash
# Invoked by the GitHub Actions workflow inside the
# reactivecircus/android-emulator-runner step. The runner spawns each line of
# its inline `script:` block as a separate `sh -c`, which is incompatible
# with shell control flow (while/for/etc). We extract the run logic here so
# everything executes in a single bash invocation.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> ci: starting Appium server"
nohup npx appium --base-path=/wd/hub > /tmp/appium.log 2>&1 &

echo "==> ci: waiting for Appium /status"
i=0
while [ $i -lt 30 ]; do
  if curl -s http://127.0.0.1:4723/wd/hub/status >/dev/null 2>&1; then
    echo "    appium ready"
    break
  fi
  sleep 1
  i=$((i+1))
done
if [ $i -eq 30 ]; then
  echo "    appium did not respond — dumping log:"
  tail -50 /tmp/appium.log || true
  exit 1
fi

echo "==> ci: running spec"
npx playwright test
