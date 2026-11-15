import { InMemoryWikiStore } from "@cortex/adapters";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createContainer, useContainer } from "../container";
import { STARTER_BRAIN } from "../lib/starter-brain";
import listPages from "./list_pages";
import readPage from "./read_page";
import searchWiki from "./search_wiki";
import writePage from "./write_page";

type Run = (input: unknown) => Promise<unknown>;
const run = (tool: { execute?: unknown }) => tool.execute as Run;

let store: InMemoryWikiStore;
beforeEach(() => {
  const c = createContainer({});
  store = c.wikiStore as InMemoryWikiStore;
  useContainer(c);
});
afterEach(() => useContainer(undefined));

type Note = {
  source: { title: string; origin: string; text: string };
  pages: { path?: string; title: string; summary: string; body: string }[];
};

const deploys = { title: "Deploys", summary: "How we ship", body: "We deploy on push.\n" };
const note: Note = {
  source: { title: "Deploy notes", origin: "pasted", text: "We deploy on push." },
  pages: [deploys],
};

describe("wiki tools", () => {
  it("list_pages lists the pages", async () => {
    await expect(run(listPages)({})).resolves.toEqual({ pages: ["wiki/welcome.md"] });
  });

  it("read_page returns the page, or an error result", async () => {
    await expect(run(readPage)({ path: "wiki/welcome.md" })).resolves.toMatchObject({
      title: "Welcome to the brain",
      body: expect.stringContaining("team's brain"),
    });
    await expect(run(readPage)({ path: "AGENTS.md" })).resolves.toMatchObject({
      error: "InvalidPathError",
    });
  });

  it("search_wiki ranks matching pages", async () => {
    const result = (await run(searchWiki)({ query: "companion pages" })) as {
      results: { path: string }[];
    };
    expect(result.results.map((hit) => hit.path)).toEqual(["wiki/welcome.md"]);
  });

  it("write_page ingests as one commit", async () => {
    await expect(run(writePage)(note)).resolves.toMatchObject({
      committed: true,
      source: expect.stringMatching(/^raw\/\d{4}-\d{2}-\d{2}-deploy-notes\.md$/),
      changes: ["create wiki/deploys.md"],
    });
    expect(store.commits).toHaveLength(1);
    await expect(store.readFile("wiki/deploys.md")).resolves.toContain("We deploy on push.");
  });

  it("write_page refuses a path outside wiki/ and commits nothing", async () => {
    const outside = { ...note, pages: [{ ...deploys, path: "AGENTS.md" }] };
    await expect(run(writePage)(outside)).resolves.toMatchObject({ error: "InvalidPathError" });
    expect(store.commits).toHaveLength(0);
    await expect(store.readFile("AGENTS.md")).resolves.toBe(STARTER_BRAIN["AGENTS.md"]);
  });

  it("write_page needs no approval (ADR-0011)", () => {
    expect(writePage.approval).toBeUndefined();
  });
});
