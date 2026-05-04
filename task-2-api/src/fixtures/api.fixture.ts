import { test as base } from '@playwright/test';
import { GitHubOrgApi } from '@apis/github-org-api';

/**
 * Custom fixtures for the API task. Tests declare which clients they
 * need; Playwright builds them once per test using the configured
 * `request` context (which already has GitHub headers attached).
 */
type ApiFixtures = {
  githubApi: GitHubOrgApi;
};

export const test = base.extend<ApiFixtures>({
  githubApi: async ({ request }, use) => {
    await use(new GitHubOrgApi(request));
  },
});

export { expect } from '@playwright/test';
