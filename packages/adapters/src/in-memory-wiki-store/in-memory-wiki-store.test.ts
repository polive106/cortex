import { Changeset } from "@cortex/domain";
import { describe, expect, it } from "vitest";
import { CONTRACT_SEED, describeWikiStoreContract } from "../contracts/wiki-store-contract";
import { InMemoryWikiStore } from "./in-memory-wiki-store";

describeWikiStoreContract("InMemoryWikiStore", async () => new InMemoryWikiStore(CONTRACT_SEED));

describe("InMemoryWikiStore", () => {
  it("records each commit for inspection", async () => {
    const store = new InMemoryWikiStore();
    await store.commit(new Changeset().write("a", "1").write("b", "2"), "first");
    expect(store.commits).toEqual([{ ref: "memory-1", message: "first", paths: ["a", "b"] }]);
  });

  it("doesn't share state with its seed object", async () => {
    const seed = { "wiki/a.md": "a" };
    const store = new InMemoryWikiStore(seed);
    await store.commit(new Changeset().write("wiki/b.md", "b"), "x");
    expect(Object.keys(seed)).toEqual(["wiki/a.md"]);
  });
});
