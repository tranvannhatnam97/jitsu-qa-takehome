import { APIRequestContext, APIResponse, expect } from '@playwright/test';

/**
 * Thin wrapper around Playwright's `APIRequestContext` that:
 *   - centralises request execution and response validation,
 *   - parses RFC 5988 `Link` headers and walks paginated endpoints,
 *   - exposes a single typed entrypoint (`paginate`) for "give me everything".
 *
 * Domain-specific clients (e.g. `GitHubOrgApi`) extend this so they
 * don't reimplement pagination or status checking.
 */
export class BaseApi {
  protected readonly request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  /** GET a single resource and assert a 2xx response. */
  protected async getJson<T>(url: string, params?: Record<string, string | number>): Promise<T> {
    const response = await this.request.get(url, { params });
    await this.assertOk(response, `GET ${url}`);
    return response.json() as Promise<T>;
  }

  /**
   * Walk every page of a paginated GitHub-style endpoint, returning
   * the flattened list. Uses the `Link: <...>; rel="next"` header to
   * advance — no offset math, no over-fetching.
   *
   * `perPage` defaults to 100 (GitHub's max) so we make the fewest
   * round trips possible.
   */
  protected async paginate<T>(
    initialUrl: string,
    params: Record<string, string | number> = {},
    perPage = 100,
  ): Promise<T[]> {
    const out: T[] = [];
    let url: string | null = initialUrl;
    let nextParams: Record<string, string | number> | undefined = { per_page: perPage, ...params };

    while (url) {
      const response: APIResponse = await this.request.get(url, nextParams ? { params: nextParams } : undefined);
      await this.assertOk(response, `GET ${url}`);
      const page = (await response.json()) as T[];
      out.push(...page);

      const linkHeader = response.headers()['link'];
      url = parseNextLink(linkHeader);
      nextParams = undefined; // the `next` URL already encodes its params
    }
    return out;
  }

  protected async assertOk(response: APIResponse, ctx: string): Promise<void> {
    if (!response.ok()) {
      const body = await response.text().catch(() => '<no body>');
      expect.soft(response.ok(), `${ctx} → ${response.status()} ${response.statusText()}\n${body}`).toBe(true);
      throw new Error(`${ctx} failed: ${response.status()}`);
    }
  }
}

/** Extract the `rel="next"` target from a GitHub Link header. Returns null if there is no next page. */
function parseNextLink(linkHeader: string | undefined): string | null {
  if (!linkHeader) return null;
  for (const part of linkHeader.split(',')) {
    const [rawUrl, ...attrs] = part.split(';').map((s) => s.trim());
    if (attrs.some((a) => a === 'rel="next"')) {
      const match = rawUrl.match(/^<(.+)>$/);
      if (match) return match[1];
    }
  }
  return null;
}
