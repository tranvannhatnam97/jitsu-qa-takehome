# Task I — Web Automation (`time.is`)

Playwright + TypeScript. The test opens `https://time.is`, searches for a city, and asserts:

1. The city name appears in the result page heading.
2. The current date is rendered.
3. The clock displays `HH:MM:SS` and the seconds value advances within a short observation window.

## Prerequisites

- Node.js ≥ 20
- npm (or pnpm/yarn — examples below use npm)

## Install

```bash
cd task-1-web
npm install
npx playwright install chromium
```

## Run

```bash
npm test                    # headless
npm run test:headed         # show the browser
npm run test:ui             # Playwright UI mode
npm run report              # generate + open Allure report (needs Java 11+)
npm run report:html         # open the Playwright HTML report
npm run typecheck           # strict TS check
```

## Reporting

Two reporters run in parallel:

- **Playwright HTML** at `playwright-report/` (open with `npm run report:html`)
- **Allure** at `allure-results/` → `allure-report/` (build + open with `npm run report`)

Allure attaches a screenshot after every `test.step` (helper `stepWithSnap` in `src/core/step.ts`) plus the full Playwright `video: 'on'` recording.

## Project structure

```
task-1-web/
├── playwright.config.ts          # base URL, retries, reporters, trace/video on failure
├── tsconfig.json                 # path aliases: @core, @pages, @fixtures
├── src/
│   ├── core/
│   │   ├── base-component.ts     # Page wrapper: actions + reads + waits + assertions
│   │   └── base-page.ts          # navigation helpers; pages inherit
│   ├── pages/
│   │   ├── home-page.ts          # time.is landing — exposes searchCity()
│   │   └── time-result-page.ts   # city result — heading / date / live clock
│   └── fixtures/
│       └── pages.fixture.ts      # extends Playwright `test` with page-object fixtures
└── tests/
    └── time.spec.ts              # spec — data-driven over the CITIES array
```

## Design notes

- **Page Object Model.** Each page exposes intent-revealing methods (`searchCity`, `assertClockTicks`) instead of leaking selectors into tests.
- **Custom fixtures.** Tests receive `homePage` / `timeResultPage` directly via the extended `test` from `src/fixtures/pages.fixture.ts`. No manual `new HomePage(page)` in specs.
- **Reliable clock check.** `assertClockTicks` reads the time once, then uses `expect.poll(...).not.toBe(initial)` — the assertion passes the moment the seconds value changes, with a bounded timeout. No fixed sleeps.
- **Search resilience.** `HomePage.searchCity` first tries to click the autocomplete suggestion; if none appears, it falls back to pressing Enter. Both paths wait for the URL to change before returning the next page object, avoiding races.
- **Adding a city.** Append to the `CITIES` array in `tests/time.spec.ts` — the test is parametrised.

## Assumptions

- `time.is` continues to expose `#twd` (clock), `#dd` (date), and `h1` (city heading) on result pages. If the site restructures, only the selectors in `time-result-page.ts` need to change.
- Network is reachable; tests retry once on CI for transient flakiness.
