import { Changeset, ReadOnlyBrainError } from "@cortex/domain";
import { describe, expect, it } from "vitest";
import { InMemoryWikiStore } from "../in-memory-wiki-store/in-memory-wiki-store";
import { ReadOnlyWikiStore } from "./read-only-wiki-store";

describe("ReadOnlyWikiStore", () => {
  const inner = new InMemoryWikiStore({
    "wiki/a.md": "alpha",
    "index.md": "i",
    "out/plan.html": "<p>plan</p>",
  });
  const store = new ReadOnlyWikiStore(inner, "The brain isn't connected yet");

  it("reads through to the wrapped store", async () => {
    await expect(store.readFile("index.md")).resolves.toBe("i");
    await expect(store.listPages()).resolves.toEqual(["wiki/a.md"]);
    await expect(store.head()).resolves.toBe("memory-0");
    await expect(store.readPages()).resolves.toEqual([{ path: "wiki/a.md", content: "alpha" }]);
    await expect(store.listArtifacts()).resolves.toEqual(["out/plan.html"]);
    await expect(store.readFile("index.md", "unknown-ref")).resolves.toBeNull();
  });

  it("refuses every commit with the reason, writing nothing", async () => {
    await expect(store.commit(new Changeset().write("wiki/b.md", "b"), "x")).rejects.toThrow(
      new ReadOnlyBrainError("The brain isn't connected yet; nothing was saved"),
    );
    expect(inner.commits).toEqual([]);
  });
});
