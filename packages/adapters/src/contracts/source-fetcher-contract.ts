import { type FetchedSource, SourceFetchError, type SourceFetcher } from "@cortex/domain";
import { describe, expect, it } from "vitest";

/** Behavior every SourceFetcher shares (ADR-0002), so the twin can stand in for the web. */
export function describeSourceFetcherContract(
  name: string,
  make: (pages: Record<string, FetchedSource>) => Promise<SourceFetcher>,
) {
  describe(`${name} (SourceFetcher contract)`, () => {
    const pages = { "https://contract.test/post": { title: "Post", text: "Hello there." } };

    it("returns a page's title and text", async () => {
      const fetcher = await make(pages);
      await expect(fetcher.fetch("https://contract.test/post")).resolves.toEqual({
        title: "Post",
        text: "Hello there.",
      });
    });

    it("throws SourceFetchError for a page that isn't there", async () => {
      const fetcher = await make(pages);
      await expect(fetcher.fetch("https://contract.test/missing")).rejects.toThrow(
        SourceFetchError,
      );
    });
  });
}
