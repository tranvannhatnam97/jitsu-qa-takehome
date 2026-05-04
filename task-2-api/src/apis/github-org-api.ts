import { BaseApi } from '@core/base-api';

/** Subset of fields we use from the `repos` endpoint. */
export interface Repo {
  name: string;
  full_name: string;
  open_issues_count: number;
  watchers_count: number;
  subscribers_count?: number; // present on the per-repo endpoint, not the list endpoint
  updated_at: string; // ISO8601
  pushed_at: string; // ISO8601
  archived: boolean;
  fork: boolean;
}

/**
 * REST client for a GitHub organisation. All methods paginate transparently,
 * so a caller can ask "give me all repos" without thinking about pages.
 */
export class GitHubOrgApi extends BaseApi {
  /** Every public repo in the org, including archived/forks (callers can filter). */
  async listAllRepos(org: string): Promise<Repo[]> {
    return this.paginate<Repo>(`/orgs/${org}/repos`, { type: 'public', sort: 'full_name' });
  }

  /**
   * Total open issues across the org, summed from each repo's
   * `open_issues_count`. Note: GitHub's `open_issues_count` includes
   * open pull requests — to count issues only, use the search endpoint
   * (`countOpenIssuesViaSearch`).
   */
  async countOpenIssues(org: string): Promise<number> {
    const repos = await this.listAllRepos(org);
    return repos.reduce((sum, r) => sum + (r.open_issues_count ?? 0), 0);
  }

  /** Strict issue count via search (excludes PRs). One request, but rate-limited per minute. */
  async countOpenIssuesViaSearch(org: string): Promise<number> {
    const data = await this.getJson<{ total_count: number }>(`/search/issues`, {
      q: `org:${org} is:issue is:open`,
      per_page: 1,
    });
    return data.total_count;
  }

  /** The N most recently updated repos in the org, descending by `updated_at`. */
  async mostRecentlyUpdated(org: string, top = 5): Promise<Repo[]> {
    const repos = await this.listAllRepos(org);
    return [...repos]
      .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
      .slice(0, top);
  }

  /** The single repo with the highest `watchers_count`. Ties broken by name (alphabetical). */
  async mostWatched(org: string): Promise<Repo> {
    const repos = await this.listAllRepos(org);
    if (repos.length === 0) {
      throw new Error(`Organisation "${org}" has no public repos.`);
    }
    return [...repos].sort((a, b) => {
      if (b.watchers_count !== a.watchers_count) return b.watchers_count - a.watchers_count;
      return a.name.localeCompare(b.name);
    })[0];
  }
}
