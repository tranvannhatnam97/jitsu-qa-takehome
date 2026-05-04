# Task II — GitHub REST API Automation

Playwright `request` context + TypeScript. The test queries a public GitHub organisation and asserts:

1. **Total open issues** across all of the org's public repositories.
2. **Most recently updated repositories** — sorted descending by `updated_at`.
3. **Most-watched repository** in the org.

Default org is `SeleniumHQ`. Override via `GITHUB_ORG=<name>`.

## Prerequisites

- Node.js ≥ 20

## Install

```bash
cd task-2-api
npm install
```

## Run

```bash
npm test                              # run against SeleniumHQ
GITHUB_ORG=playwright npm test        # run against a different org
GITHUB_TOKEN=ghp_xxx npm test         # use a PAT (raises rate limit 60→5,000/hr)
npm run report                        # open the HTML report
npm run typecheck                     # strict TS check
```

## Project structure

```
task-2-api/
├── playwright.config.ts            # baseURL + GitHub headers (Authorization injected if GITHUB_TOKEN set)
├── tsconfig.json
├── src/
│   ├── core/
│   │   └── base-api.ts             # request wrapper: pagination via Link header, status assertion
│   ├── apis/
│   │   └── github-org-api.ts       # domain client: listAllRepos, countOpenIssues, mostRecentlyUpdated, mostWatched
│   └── fixtures/
│       └── api.fixture.ts          # extends Playwright `test` with a `githubApi` fixture
└── tests/
    └── github-org.spec.ts          # spec — 3 steps, one per question
```

## Design notes

- **Pagination is centralised.** `BaseApi.paginate()` follows the `rel="next"` `Link` header until exhausted, with `per_page=100` to minimise round-trips. Domain methods just say "give me all repos" — no page math leaks into them.
- **Domain layer is thin and typed.** `GitHubOrgApi` exposes one method per question; the test reads almost like prose.
- **Custom fixture.** `tests/github-org.spec.ts` receives `githubApi` directly. No constructor calls in the spec.
- **Auth-aware.** A `GITHUB_TOKEN` env var is wired into `extraHTTPHeaders` automatically. Without it the test still runs, but the unauthenticated 60 req/hr limit may bite for very large orgs.
- **Idempotent assertions.** Q3's check (`top.watchers_count === max`) uses the same data Q1 collected — there is no second source of truth for the matcher to drift against.

## Caveats

- GitHub's `open_issues_count` field includes **open pull requests** — that's the field used by `countOpenIssues`, mirroring how the GitHub UI reports the number. A PR-free count is available via `countOpenIssuesViaSearch` (uses `/search/issues`, single request, but lower rate limits).
- `watchers_count` from the list endpoint is actually the star count — GitHub's API has carried this misnomer for years. The real "subscribers" (notifications-watchers) count is on the per-repo endpoint as `subscribers_count`. We use `watchers_count` because that is what the task asks for and what the public UI shows under "Watch".
