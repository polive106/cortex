import { describe, expect, it } from "vitest";
import { describeSourceFetcherContract } from "../contracts/source-fetcher-contract";
import { InMemorySourceFetcher } from "./in-memory-source-fetcher";

describeSourceFetcherContract(
  "InMemorySourceFetcher",
  async (pages) => new InMemorySourceFetcher(pages),
);

describe("InMemorySourceFetcher", () => {
  it("records each URL it was asked for", async () => {
    const fetcher = new InMemorySourceFetcher({ "https://a.test/": { title: "A", text: "a" } });
    await fetcher.fetch("https://a.test/");
    await fetcher.fetch("https://b.test/").catch(() => undefined);
    expect(fetcher.fetched).toEqual(["https://a.test/", "https://b.test/"]);
  });
});
