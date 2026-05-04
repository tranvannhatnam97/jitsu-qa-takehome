# Task III — Mobile Automation (Jitsu Driver Android app)

Appium + WebdriverIO + TypeScript, run by Playwright's test runner so the
fixture pattern, `expect` API, and reporter are consistent with Tasks I and II.

The spec covers the six steps from the PDF:

1. Log in with `auto_244332` / `Testing1!`
2. Open Profile → tap Tutorials
3. Verify the Tutorials screen shows `Assigned Route`, `Direct Booking`, and `Ticket Booking`
4. Tap `Assigned Route`
5. Verify the Active Assignment screen shows the tutorial card for the selected section
6. Tap `Start Tutorial`, then verify the tutorial content card loads (handles both states from PDF screenshots 4 and 5)

## Prerequisites

| Tool | Version | Why |
|------|---------|-----|
| Node.js | ≥ 20 | runtime |
| Java JDK | 17 | required by `sdkmanager` and the UiAutomator2 driver |
| Android SDK | 34 + system image | provides `adb`, `emulator`, AVD storage |
| Appium 2 | bundled via npm | WebDriver server |
| `appium-uiautomator2-driver` | bundled via npm | the Android automation driver |
| Android emulator (or real device) | API 34 | the test target |
| `apps/jitsu-driver.apk` | provided | placed under `task-3-mobile/apps/` |

## One-time setup

```bash
# 1. JDK and Android command-line tools (no sudo)
brew install openjdk@17
brew install --cask android-commandlinetools

# 2. Activate env vars in this shell (and any future shell)
source scripts/setup-env.sh

# 3. Install SDK components (~3–4 GB on disk)
yes | sdkmanager --licenses --sdk_root=$ANDROID_HOME
sdkmanager --sdk_root=$ANDROID_HOME \
    "platform-tools" \
    "platforms;android-34" \
    "build-tools;34.0.0" \
    "emulator" \
    "system-images;android-34;google_apis;arm64-v8a"

# 4. Create an AVD
avdmanager create avd -n jitsu_test \
    -k "system-images;android-34;google_apis;arm64-v8a" \
    --device "pixel_5"

# 5. Project deps (Appium + uiautomator2 driver + webdriverio + Playwright runner)
npm install
npx appium driver install uiautomator2

# 6. Place the APK
cp /path/to/downloaded/jitsu-driver.apk apps/
```

## Run

```bash
# Terminal A — boot the emulator (leave running)
source scripts/setup-env.sh
emulator -avd jitsu_test -no-snapshot -no-audio &
adb wait-for-device

# Terminal B — start Appium (leave running)
source scripts/setup-env.sh
npm run appium

# Terminal C — run the test
source scripts/setup-env.sh
npm test
```

## Project structure

```
task-3-mobile/
├── playwright.config.ts        # serial worker, no browser projects
├── tsconfig.json               # path aliases: @core, @screens, @fixtures
├── package.json
├── README.md                   # this file
├── scripts/setup-env.sh        # exports JAVA_HOME, ANDROID_HOME, PATH
├── apps/
│   └── jitsu-driver.apk        # gitignored
├── src/
│   ├── core/
│   │   ├── driver.ts           # WebdriverIO `remote()` factory with caps
│   │   └── base-screen.ts      # actions / reads / waits / assertions
│   ├── screens/
│   │   ├── login-screen.ts
│   │   ├── profile-screen.ts
│   │   ├── tutorials-screen.ts
│   │   └── active-assignment-screen.ts
│   └── fixtures/
│       └── screens.fixture.ts  # extends Playwright `test` with driver + screens
└── tests/
    └── tutorials.spec.ts       # the spec — six `test.step` blocks
```

## Design notes

- **Same fixture pattern as Tasks I and II.** `screens.fixture.ts` extends Playwright's `test` so the spec receives `loginScreen`, `profileScreen`, etc., already wired to a fresh Appium session. The session is created in the `driver` fixture and torn down on test teardown — no leaks if a step fails mid-test.
- **One shared `BaseScreen`.** Mirrors `BaseComponent` from Tasks I and II: `tap`, `type`, `textOf`, `isDisplayed`, `waitForDisplayed`, plus assertion helpers backed by `expect.poll` for retry-until-true semantics on flaky UI.
- **Selector strategy.** Text-based xpath (`//android.widget.TextView[@text="..."]`) is the default because it survives obfuscation and is readable in failure messages. Once the APK is opened in Appium Inspector we should swap heavy-traffic locators for `~accessibility_id` where stable ones exist.
- **Step orchestration in the spec.** The test body is six `test.step` blocks that mirror the PDF requirements 1:1 — failures point at the requirement that broke, not at a generic line in the test.
- **Idempotent startup.** The `tutorials.spec.ts` step that handles state 4 vs state 5 (already-active tutorial) calls `isTutorialActive()` and treats both branches uniformly: tap Start Tutorial, then assert the content card loads.

## Known caveats

- The PDF doesn't ship a list of stable accessibility ids for the app. The xpath text matchers used here are reasonable defaults, but a 30-minute pass with **Appium Inspector** (`appium-inspector` desktop app) against the running emulator would let us replace them with `~ids` and tighten the spec.
- Apple Silicon Macs need the **`arm64-v8a`** system image (commands above already specify it). x86_64 images do not run on M-series Macs even via emulation.
- `appium-uiautomator2-driver` requires Java 11 or newer at runtime; Java 17 (installed via `openjdk@17`) is the safe default.
- If the APK targets a newer SDK than 34 (Android 14), bump `android-34` to the matching version in the setup commands.

## Reproduction status

The spec was executed end-to-end on a freshly provisioned environment:
JDK 17, Android cmdline-tools, SDK 34 + `system-images;android-34;google_apis;arm64-v8a`,
emulator, AVD `jitsu_test`, Appium 2 with the `uiautomator2` driver,
Playwright runner. The APK was downloaded from the Google Drive link in
the take-home and placed at `apps/jitsu-driver.apk`. Test result:

```
Running 1 test using 1 worker
  ✓ 1 tests/tutorials.spec.ts:9:7 › Jitsu Driver — Tutorials ›
       login → Profile → Tutorials shows all sections;
       Assigned Route launches tutorial (22.3s)
  1 passed (22.7s)
```

## Selector discovery

`scripts/probe-flow.ts` is a one-shot utility that drove the app step by
step and saved the UiAutomator hierarchy to `tmp/probe/*.xml` after each
action. Three findings shaped the screen objects:

1. **React Native input quirk.** Programmatic `setValue` on the username
   and password fields does not fire React's `onChangeText`, so the form
   submits empty (the app responds with "Username cannot be empty.").
   Fix: `click()` the field first, then `addValue()` to drive the IME
   path. Implemented in `LoginScreen.login`.
2. **Instabug onboarding overlay.** A centred dialog ("Powered by
   Instabug") covers the home immediately after login. A single tap at
   the top of the screen — outside the dialog bounds — collapses it.
   Implemented in `ProfileScreen.dismissInstabugOverlay`.
3. **Tutorials row overlapping the bottom-nav.** The "Tutorials" row's
   bounding box extends into the Messenger tab icon, so a centred tap
   navigates to Messenger instead. Fix: tap at `y = top + height/4` of
   the row. Implemented in `ProfileScreen.openTutorials`.

Re-run `npx tsx scripts/probe-flow.ts` against any future build of the
APK to refresh the dumps if selectors drift.
