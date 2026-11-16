import { describe, expect, it } from "vitest";
import { ConflictError, InvalidIngestError, InvalidPathError } from "../errors";
import { FakeWikiStore, fixedClock } from "../testing/fake-wiki-store";
import { Ingest, type IngestRequest } from "./ingest";

const BRAIN = {
  "AGENTS.md": "# Schema\n",
  "index.md": "# Index\n\n- [Deploys](wiki/deploys.md) — Old summary\n",
  "log.md": "# Log\n",
  "wiki/deploys.md":
    "---\ntitle: Deploys\nsummary: Old summary\nsources:\n  - raw/2026-01-01-old.md\nupdated: 2026-01-01\n---\n\nOld body\n",
};

const request = (overrides: Partial<IngestRequest> = {}): IngestRequest => ({
  source: { title: "Deploy notes", origin: "pasted", text: "We deploy on push.\n" },
  pages: [
    { path: "wiki/deploys.md", title: "Deploys", summary: "Deploy on push", body: "Merged body\n" },
    { title: "CI checks", summary: "What runs on push", body: "Lint and tests\n" },
  ],
  ...overrides,
});

const setup = (files: Record<string, string> = BRAIN) => {
  const store = new FakeWikiStore({ ...files });
  return { store, ingest: new Ingest(store, fixedClock()) };
};

describe("Ingest", () => {
  it("writes raw/, pages, index.md and log.md in exactly one commit", async () => {
    const { store, ingest } = setup();
    const result = await ingest.execute(request());
    expect(store.commits).toEqual([
      {
        message: "ingest: Deploy notes",
        paths: [
          "raw/2026-11-14-deploy-notes.md",
          "wiki/deploys.md",
          "wiki/ci-checks.md",
          "index.md",
          "log.md",
        ],
      },
    ]);
    expect(result).toEqual({
      ref: "commit-1",
      source: "raw/2026-11-14-deploy-notes.md",
      changes: ["update wiki/deploys.md", "create wiki/ci-checks.md"],
    });
  });

  it("keeps earlier sources on updated pages and stamps today's date", async () => {
    const { store, ingest } = setup();
    await ingest.execute(request());
    expect(store.files["wiki/deploys.md"]).toBe(
      "---\ntitle: Deploys\nsummary: Deploy on push\nsources:\n  - raw/2026-01-01-old.md\n  - raw/2026-11-14-deploy-notes.md\nupdated: 2026-11-14\n---\n\nMerged body\n",
    );
  });

  it("merges into the index: one line per page, summaries updated", async () => {
    const { store, ingest } = setup();
    await ingest.execute(request());
    expect(store.files["index.md"]).toBe(
      "# Index\n\n- [Deploys](wiki/deploys.md) — Deploy on push\n- [CI checks](wiki/ci-checks.md) — What runs on push\n",
    );
  });

  it("appends a log entry and stores the raw source with provenance", async () => {
    const { store, ingest } = setup();
    await ingest.execute(request());
    expect(store.files["log.md"]).toBe(
      "# Log\n\n## [2026-11-14] ingest | Deploy notes\n\n- source raw/2026-11-14-deploy-notes.md\n- update wiki/deploys.md\n- create wiki/ci-checks.md\n",
    );
    expect(store.files["raw/2026-11-14-deploy-notes.md"]).toContain("origin: pasted\n");
  });

  it("starts index.md and log.md when the brain has none", async () => {
    const { store, ingest } = setup({});
    await ingest.execute(request({ pages: [{ title: "A", summary: "a", body: "a" }] }));
    expect(store.files["index.md"]).toBe("- [A](wiki/a.md) — a\n");
    expect(store.files["log.md"]).toContain("## [2026-11-14] ingest | Deploy notes");
  });

  it("never overwrites a raw source: a taken name gets the next free number", async () => {
    const { store, ingest } = setup({
      ...BRAIN,
      "raw/2026-11-14-deploy-notes.md": "first",
      "raw/2026-11-14-deploy-notes-2.md": "second",
    });
    const result = await ingest.execute(request());
    expect(result.source).toBe("raw/2026-11-14-deploy-notes-3.md");
    expect(store.files["raw/2026-11-14-deploy-notes.md"]).toBe("first");
    expect(store.files["raw/2026-11-14-deploy-notes-2.md"]).toBe("second");
    expect(store.files["raw/2026-11-14-deploy-notes-3.md"]).toContain("We deploy on push.");
    expect(store.files["log.md"]).toContain("- source raw/2026-11-14-deploy-notes-3.md");
  });

  it("re-reads and re-plans once when the brain moves under the commit", async () => {
    const { store, ingest } = setup();
    store.headMovesFor = 1;
    await expect(ingest.execute(request())).resolves.toMatchObject({ ref: "commit-1" });
  });

  it("gives up with ConflictError when the brain keeps moving", async () => {
    const { store, ingest } = setup();
    store.headMovesFor = 2;
    await expect(ingest.execute(request())).rejects.toThrow(ConflictError);
    expect(store.commits).toEqual([]);
  });

  it("rejects a page outside wiki/", async () => {
    const { ingest } = setup();
    await expect(
      ingest.execute(
        request({ pages: [{ path: "AGENTS.md", title: "x", summary: "x", body: "x" }] }),
      ),
    ).rejects.toThrow(InvalidPathError);
  });

  it("rejects an ingest with no pages or with the same page twice", async () => {
    const { ingest } = setup();
    await expect(ingest.execute(request({ pages: [] }))).rejects.toThrow(InvalidIngestError);
    const twice = { title: "A", summary: "a", body: "a" };
    await expect(ingest.execute(request({ pages: [twice, twice] }))).rejects.toThrow(
      InvalidIngestError,
    );
  });
});
