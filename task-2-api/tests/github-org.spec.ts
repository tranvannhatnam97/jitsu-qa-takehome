import { test, expect } from '@fixtures/api.fixture';

const ORG = process.env.GITHUB_ORG ?? 'SeleniumHQ';
const TOP_RECENT = 5;

test.describe(`GitHub org "${ORG}"`, () => {
  test('aggregate stats: open issues, recent updates, most watched', async ({ githubApi }) => {
    const repos = await githubApi.listAllRepos(ORG);
    expect(repos.length, 'org should have at least one public repo').toBeGreaterThan(0);

    await test.step('Q1 — total open issues across all repos', async () => {
      const total = await githubApi.countOpenIssues(ORG);
      expect(total, 'open issue count is non-negative').toBeGreaterThanOrEqual(0);
      console.log(`[${ORG}] total open issues (incl. PRs): ${total}`);
    });

    await test.step(`Q2 — top ${TOP_RECENT} most recently updated repos`, async () => {
      const recent = await githubApi.mostRecentlyUpdated(ORG, TOP_RECENT);
      expect(recent.length).toBeGreaterThan(0);

      // The list must be strictly non-increasing by updated_at.
      for (let i = 1; i < recent.length; i++) {
        const prev = Date.parse(recent[i - 1].updated_at);
        const curr = Date.parse(recent[i].updated_at);
        expect(prev, `repo at index ${i - 1} should be updated >= the one at ${i}`).toBeGreaterThanOrEqual(curr);
      }

      console.log(`[${ORG}] most recently updated:`);
      for (const r of recent) console.log(`  - ${r.full_name}  (updated ${r.updated_at})`);
    });

    await test.step('Q3 — repo with the most watchers', async () => {
      const top = await githubApi.mostWatched(ORG);
      const maxFromList = Math.max(...repos.map((r) => r.watchers_count));
      expect(top.watchers_count, 'top repo must hold the global maximum').toBe(maxFromList);
      console.log(`[${ORG}] most watched: ${top.full_name} (${top.watchers_count} watchers)`);
    });
  });
});
