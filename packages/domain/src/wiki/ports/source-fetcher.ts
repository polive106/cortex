export interface FetchedSource {
  readonly title: string;
  readonly text: string;
}

/** Turns a URL into readable text (E3-US07). Throws SourceFetchError. */
export interface SourceFetcher {
  fetch(url: string): Promise<FetchedSource>;
}
