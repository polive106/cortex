import { type FetchedSource, SourceFetchError, type SourceFetcher } from "@cortex/domain";

/** SourceFetcher twin for tests, evals, and E2E: serves fixed pages and never touches the network. */
export class InMemorySourceFetcher implements SourceFetcher {
  readonly fetched: string[] = [];

  constructor(private readonly pages: Readonly<Record<string, FetchedSource>>) {}

  async fetch(url: string): Promise<FetchedSource> {
    this.fetched.push(url);
    const page = this.pages[url];
    if (!page) throw new SourceFetchError(url, "HTTP 404");
    return { ...page };
  }
}
