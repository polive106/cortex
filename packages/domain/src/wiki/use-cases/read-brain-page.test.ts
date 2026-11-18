import { describe, expect, it } from "vitest";
import { Changeset } from "../entities/changeset";
import { InvalidPathError, PageNotFoundError } from "../errors";
import { FakeWikiStore } from "../testing/fake-wiki-store";
import { ReadBrainPage } from "./read-brain-page";

const PAGE = `---
title: Deploys
summary: How we ship
sources: []
updated: 2026-11-10
---
# Deploys

See [on-call](team/on-call.md).
`;

describe("ReadBrainPage", () => {
  it("returns a page with the head it was read at", async () => {
    const store = new FakeWikiStore({ "wiki/deploys.md": PAGE });
    await expect(new ReadBrainPage(store).execute("wiki/deploys.md")).resolves.toEqual({
      ref: "commit-0",
      path: "wiki/deploys.md",
      title: "Deploys",
      summary: "How we ship",
      updated: "2026-11-10",
      body: "# Deploys\n\nSee [on-call](team/on-call.md).\n",
    });
  });

  it("returns index.md as the Index page", async () => {
    const store = new FakeWikiStore({ "index.md": "- [Deploys](wiki/deploys.md) — ship\n" });
    await store.commit(new Changeset().write("wiki/x.md", "x"), "seed");
    await expect(new ReadBrainPage(store).execute("index.md")).resolves.toEqual({
      ref: "commit-1",
      path: "index.md",
      title: "Index",
      summary: "",
      updated: "",
      body: "- [Deploys](wiki/deploys.md) — ship\n",
    });
  });

  it("refuses paths outside index.md and wiki/", async () => {
    const store = new FakeWikiStore({ "AGENTS.md": "# Schema" });
    await expect(new ReadBrainPage(store).execute("AGENTS.md")).rejects.toBeInstanceOf(
      InvalidPathError,
    );
    await expect(new ReadBrainPage(store).execute("wiki/../AGENTS.md")).rejects.toBeInstanceOf(
      InvalidPathError,
    );
  });

  it("says when a page or the index is missing", async () => {
    const store = new FakeWikiStore();
    await expect(new ReadBrainPage(store).execute("wiki/nope.md")).rejects.toBeInstanceOf(
      PageNotFoundError,
    );
    await expect(new ReadBrainPage(store).execute("index.md")).rejects.toBeInstanceOf(
      PageNotFoundError,
    );
  });
});
