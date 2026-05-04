# Jitsu QA Automation Take-Home

Submission for the Jitsu QA Automation take-home exercise covering web UI, REST API, and (optionally) mobile test automation.

## Tasks

| # | Task | Stack | Folder |
|---|------|-------|--------|
| I | Web automation against `time.is` | Playwright + TypeScript | [task-1-web/](./task-1-web/) |
| II | GitHub REST API automation | Playwright (request context) + TypeScript | [task-2-api/](./task-2-api/) |
| III | Mobile (Jitsu Driver app) — optional | Appium | [task-3-mobile/](./task-3-mobile/) |

Each task is a self-contained project with its own `package.json`, dependencies, and README. See the per-task READMEs for prerequisites and run instructions.

## Design principles

- **Page Object Model** — selectors and page-specific actions are encapsulated in classes under `src/pages/` (or `src/apis/` for the API task). Tests stay declarative.
- **Custom fixtures** — Playwright `test` is extended in `src/fixtures/` to auto-construct page objects / API clients per worker. Tests receive ready-to-use objects instead of doing setup themselves.
- **Reliable over flaky** — assertions use Playwright's auto-retrying matchers (`expect.toBeVisible`, `expect.toHaveText`, `expect.poll`). No arbitrary `sleep` calls.
- **Separation of concerns** — `src/core/` holds reusable infra (base classes, helpers); `src/pages/` and `src/apis/` hold domain-specific layers; `tests/` contains assertions only.
