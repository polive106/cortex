import { SourceUrl } from "../entities/source-url";
import type { FetchedSource, SourceFetcher } from "../ports/source-fetcher";

export interface FetchedUrl extends FetchedSource {
  /** The URL as fetched (normalized, without the fragment): the origin to ingest it under. */
  readonly url: string;
}

/**
 * Reads a web page for the agent to save or summarize (E3-US07). The URL policy runs first, so
 * a private or local address never reaches the fetcher. Throws SourceFetchError.
 */
export class FetchSource {
  constructor(private readonly fetcher: SourceFetcher) {}

  async execute(input: string): Promise<FetchedUrl> {
    const url = SourceUrl.parse(input);
    const { title, text } = await this.fetcher.fetch(url.value);
    return { url: url.value, title, text };
  }
}
