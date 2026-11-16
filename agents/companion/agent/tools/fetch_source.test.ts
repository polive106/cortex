import type { InMemorySourceFetcher } from "@cortex/adapters";
import type { WikiStore } from "@cortex/domain";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createContainer, useContainer } from "../container";
import fetchSource from "./fetch_source";
import writePage from "./write_page";

type Run = (input: unknown) => Promise<unknown>;
const run = (tool: { execute?: unknown }) => tool.execute as Run;

let fetcher: InMemorySourceFetcher;
let store: WikiStore;
beforeEach(() => {
  const c = createContainer({ SOURCE_FETCHER: "memory" });
  fetcher = c.sourceFetcher as InMemorySourceFetcher;
  store = c.wikiStore;
  useContainer(c);
});
afterEach(() => useContainer(undefined));

describe("fetch_source", () => {
  it("returns the page's URL, title, and text", async () => {
    await expect(run(fetchSource)({ url: "https://example.com/post" })).resolves.toEqual({
      url: "https://example.com/post",
      title: "Shipping on Fridays",
      text: expect.stringContaining("We deploy every Friday"),
    });
  });

  it("returns a BlockedAddressError result for a private address, and fetches nothing", async () => {
    await expect(run(fetchSource)({ url: "http://169.254.169.254/" })).resolves.toEqual({
      error: "BlockedAddressError",
      message:
        "Could not fetch http://169.254.169.254/: 169.254.169.254 is a private or local address",
    });
    expect(fetcher.fetched).toEqual([]);
  });

  it("returns a fetch error result the model can read", async () => {
    await expect(run(fetchSource)({ url: "https://example.com/missing" })).resolves.toMatchObject({
      error: "SourceFetchError",
      message: expect.stringContaining("HTTP 404"),
    });
  });

  it("is read-only, so it needs no approval", () => {
    expect(fetchSource.approval).toBeUndefined();
  });

  it("a fetched page ingests with its URL as the origin", async () => {
    const page = (await run(fetchSource)({ url: "https://example.com/post" })) as {
      url: string;
      title: string;
      text: string;
    };
    const saved = (await run(writePage)({
      source: { title: page.title, origin: page.url, text: page.text },
      pages: [{ title: "Deploys", summary: "When we deploy", body: "Fridays, before 4pm.\n" }],
    })) as { source: string };
    const raw = await store.readFile(saved.source);
    expect(raw).toContain("origin: https://example.com/post");
    expect(raw).toContain("We deploy every Friday");
  });
});
