import { Changeset, ConflictError, type WikiStore } from "@cortex/domain";
import { describe, expect, it } from "vitest";

export const CONTRACT_SEED: Record<string, string> = {
  "AGENTS.md": "# Schema\n",
  "index.md": "- [Deploys](wiki/deploys.md) — How we ship\n",
  "wiki/deploys.md": "---\ntitle: Deploys\n---\n\nWe deploy on PUSH.\n",
  "wiki/people/ada.md": "---\ntitle: Ada\n---\n\nOwns releases.\n",
  "wiki/notes.txt": "deploy, but not a page",
  "raw/2026-11-14-deploy.md": "deploy deploy",
};

/**
 * Behavior every WikiStore must share (ADR-0002: adapters and their in-memory twins pass the same
 * contract). `makeStore` gets a fresh store seeded with CONTRACT_SEED for each test.
 */
export function describeWikiStoreContract(name: string, makeStore: () => Promise<WikiStore>) {
  describe(`${name} (WikiStore contract)`, () => {
    it("reads a file, or null when it's missing", async () => {
      const store = await makeStore();
      await expect(store.readFile("AGENTS.md")).resolves.toBe("# Schema\n");
      await expect(store.readFile("wiki/people/ada.md")).resolves.toContain("Owns releases.");
      await expect(store.readFile("wiki/missing.md")).resolves.toBeNull();
    });

    it("lists only .md files under wiki/, sorted", async () => {
      const store = await makeStore();
      await expect(store.listPages()).resolves.toEqual(["wiki/deploys.md", "wiki/people/ada.md"]);
    });

    it("reads every wiki page with its content, sorted by path", async () => {
      const store = await makeStore();
      await expect(store.readPages()).resolves.toEqual([
        { path: "wiki/deploys.md", content: CONTRACT_SEED["wiki/deploys.md"] },
        { path: "wiki/people/ada.md", content: CONTRACT_SEED["wiki/people/ada.md"] },
      ]);
    });

    it("commits a changeset so every write is readable, and returns a ref", async () => {
      const store = await makeStore();
      const result = await store.commit(
        new Changeset()
          .write("raw/2026-11-15-new.md", "new source")
          .write("wiki/new/page.md", "new page")
          .write("index.md", "updated index\n"),
        "ingest: New",
      );
      expect(result.ref).toMatch(/\S/);
      await expect(store.readFile("raw/2026-11-15-new.md")).resolves.toBe("new source");
      await expect(store.readFile("index.md")).resolves.toBe("updated index\n");
      await expect(store.listPages()).resolves.toContain("wiki/new/page.md");
      await expect(store.readFile("AGENTS.md")).resolves.toBe("# Schema\n");
    });

    it("refuses the whole commit when a must-not-exist file exists", async () => {
      const store = await makeStore();
      const changeset = new Changeset()
        .write("wiki/brand-new.md", "x")
        .write("raw/2026-11-14-deploy.md", "overwrite?", { mustNotExist: true });
      await expect(store.commit(changeset, "clash")).rejects.toThrow(ConflictError);
      await expect(store.readFile("wiki/brand-new.md")).resolves.toBeNull();
      await expect(store.readFile("raw/2026-11-14-deploy.md")).resolves.toBe("deploy deploy");
    });

    it("allows a must-not-exist write for a new file", async () => {
      const store = await makeStore();
      const changeset = new Changeset().write("raw/2026-11-15-new.md", "x", { mustNotExist: true });
      await expect(store.commit(changeset, "new")).resolves.toMatchObject({
        ref: expect.any(String),
      });
    });

    it("refuses an empty changeset", async () => {
      const store = await makeStore();
      await expect(store.commit(new Changeset(), "nothing")).rejects.toThrow(/empty/i);
    });
  });
}
