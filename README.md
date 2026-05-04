# Jitsu QA Automation Take-Home

Submission for the Jitsu QA Automation take-home exercise covering web UI, REST API, and (optionally) mobile test automation.

**Repository:** https://github.com/tranvannhatnam97/jitsu-qa-takehome

## Tasks

| # | Task | Stack | Folder | Status |
|---|------|-------|--------|--------|
| I | Web automation against `time.is` | Playwright + TypeScript | [task-1-web/](./task-1-web/) | Implemented |
| II | GitHub REST API automation | Playwright (request context) + TypeScript | [task-2-api/](./task-2-api/) | Implemented |
| III | Mobile (Jitsu Driver app) — optional | Appium | [task-3-mobile/](./task-3-mobile/) | Not attempted |

Each task is a self-contained project with its own `package.json`, dependencies, and README. See the per-task READMEs for full details.

## Quick start

Both tasks run independently. Node.js ≥ 20 is the only shared prerequisite.

```bash
# Task I — web (downloads Chromium on first run)
cd task-1-web
npm install
npx playwright install chromium
npm test

# Task II — API (no browser needed)
cd ../task-2-api
npm install
npm test                        # default org: SeleniumHQ
GITHUB_TOKEN=ghp_xxx npm test   # optional: raises rate limit 60 → 5,000 / hr
```

## Sample output

**Task I:**

```
Running 1 test using 1 worker
  ✓  1 [chromium] › tests/time.spec.ts › time.is — city search ›
        shows current date and ticking clock for Los Angeles (3.5s)
  1 passed (3.9s)
```

**Task II** (against `SeleniumHQ`):

```
[SeleniumHQ] total open issues (incl. PRs): 1423
[SeleniumHQ] most recently updated:
  - SeleniumHQ/docker-selenium       (updated 2026-05-03T20:42:30Z)
  - SeleniumHQ/selenium              (updated 2026-05-03T15:59:34Z)
  - SeleniumHQ/seleniumhq.github.io  (updated 2026-05-03T10:53:25Z)
  - SeleniumHQ/selenium-ide          (updated 2026-05-01T12:28:09Z)
  - SeleniumHQ/htmlunit-driver       (updated 2026-04-25T06:51:22Z)
[SeleniumHQ] most watched: SeleniumHQ/selenium (34078 watchers)
  ✓  GitHub org "SeleniumHQ" › aggregate stats: open issues, recent updates, most watched (1.2s)
  1 passed (1.5s)
```

## Project layout

```
.
├── README.md                       # this file
├── .gitignore
├── task-1-web/                     # Task I — Playwright UI
│   ├── playwright.config.ts
│   ├── tsconfig.json               # path aliases: @core, @pages, @fixtures
│   ├── package.json
│   ├── README.md                   # task-specific docs
│   ├── src/
│   │   ├── core/                   # base-component.ts, base-page.ts
│   │   ├── pages/                  # home-page.ts, time-result-page.ts
│   │   └── fixtures/               # pages.fixture.ts (extends Playwright `test`)
│   └── tests/
│       └── time.spec.ts            # data-driven over a CITIES array
└── task-2-api/                     # Task II — Playwright APIRequestContext
    ├── playwright.config.ts        # baseURL + GitHub headers + optional Bearer token
    ├── tsconfig.json
    ├── package.json
    ├── README.md
    ├── src/
    │   ├── core/                   # base-api.ts (Link-header pagination, status assertion)
    │   ├── apis/                   # github-org-api.ts (one method per question)
    │   └── fixtures/               # api.fixture.ts
    └── tests/
        └── github-org.spec.ts
```

## Design principles

- **Page / API Object Model.** Selectors, request paths, and domain-specific logic live in classes under `src/pages/` or `src/apis/`. Specs read like prose: `await homePage.searchCity('Los Angeles')` or `await githubApi.mostWatched('SeleniumHQ')`.
- **Custom Playwright fixtures.** Each project extends `test` in `src/fixtures/` so specs declare what they need (`{ homePage, timeResultPage }` or `{ githubApi }`) and Playwright builds the objects per-test. No constructors leak into the spec body.
- **Reliable over flaky.** Assertions use Playwright's auto-retrying matchers (`expect(...).toBeVisible`, `expect.poll(...).not.toBe(initial)` for the ticking clock, `toHaveText`). The clock check verifies the seconds value advances within a bounded poll window — never a fixed `sleep`.
- **Pagination centralised.** `BaseApi.paginate()` walks the `Link: rel="next"` header until exhausted, with `per_page=100` to minimise round-trips. Domain methods (`listAllRepos`, `mostWatched`, ...) are oblivious to pages.
- **Auth-aware, optional-token.** Task II reads `GITHUB_TOKEN` from the environment and injects `Authorization: Bearer ...` only when present. The unauthenticated path still works for small orgs.
- **Separation of concerns.** `src/core/` holds infrastructure (base classes, pagination, action wrappers). `src/pages/` and `src/apis/` hold the domain. `tests/` contains assertions and step orchestration only.
- **Path aliases.** `tsconfig.json` defines `@core/*`, `@pages/*`, `@apis/*`, `@fixtures/*` — imports stay readable as the tree grows. `tsx` (used by Playwright) honours them via the same `tsconfig`.

## Engineering notes

### Pattern reuse
The base-class scaffolding (`BaseComponent`, `BasePage`) was ported from a private internal Python project (`automation-test-agent`). The pattern, not the code, was carried across: a thin `Page` wrapper exposing action / read / wait / assertion helpers, plus a `BasePage` that knows its own URL. Custom Python `assert_*` helpers were dropped in favour of Playwright's idiomatic `expect()` matchers, which auto-retry and produce better failure messages.

### Selector discovery for Task I
The task description suggests using the site's "search feature" — a non-trivial detail because `time.is` renders its UI client-side and ships a single `<input id="q">` inside `<form id="qbox" action="/" method="get">`. Submitting the form via Enter navigates to `/<City_With_Underscores>` (e.g. `/Los_Angeles`). Result-page selectors verified live: `h1` (heading), `#dd` (date), `#clock` (live `HH:MM:SS`). No autocomplete is rendered, so the search method submits the form directly and waits for a URL change.

### What I would add with more time
- **Task III (mobile)** — Appium driver setup, an `Screen` base class mirroring `BasePage`, three screen objects (`LoginScreen`, `ProfileScreen`, `TutorialsScreen`), a fixture wiring the driver, plus the spec covering tutorial dismissal.
- **CI** — a GitHub Actions workflow that runs both projects on push, with the HTML report uploaded as an artifact.
- **More cities for Task I** — the spec is already data-driven; adding entries to the `CITIES` array is a one-liner. With more time I would parametrise across timezones to surface DST edge cases.
- **Resilience around GitHub rate-limits** — for very large orgs, fall back to the conditional-request flow (`If-None-Match` / `ETag`) so re-runs against unchanged data don't cost a fresh quota.

## Assumptions

- `time.is` continues to expose `#q` (search), `#clock`, `#dd`, and `h1` selectors. If the site restructures, only `time-result-page.ts` and `home-page.ts` need to change.
- The default org for Task II is `SeleniumHQ` per the task description; override via `GITHUB_ORG=<name>`.
- GitHub's `open_issues_count` field includes open pull requests — `countOpenIssues` mirrors that, since it's also what the GitHub UI reports. A PR-free count is provided via `countOpenIssuesViaSearch` (one search request).
- `watchers_count` from the list endpoint is GitHub's long-standing alias for the *star* count; the real notifications-watchers count is on the per-repo endpoint as `subscribers_count`. The task asks for "watchers", which the public Watch button on github.com surfaces as the same number — that is what is asserted.
