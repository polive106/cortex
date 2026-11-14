import { describe, expect, it } from "vitest";
import { FakeWikiStore } from "../testing/fake-wiki-store";
import { ReadIndex } from "./read-index";

describe("ReadIndex", () => {
  it("returns the brain schema and index", async () => {
    const store = new FakeWikiStore({
      "AGENTS.md": "# Schema\n",
      "index.md": "- [A](wiki/a.md) — a\n",
    });
    await expect(new ReadIndex(store).execute()).resolves.toEqual({
      schema: "# Schema\n",
      index: "- [A](wiki/a.md) — a\n",
      truncated: false,
    });
  });

  it("treats missing files as empty", async () => {
    await expect(new ReadIndex(new FakeWikiStore()).execute()).resolves.toEqual({
      schema: "",
      index: "",
      truncated: false,
    });
  });

  it("cuts a long index at a line boundary and says how to find the rest", async () => {
    const index = Array.from({ length: 50 }, (_, i) => `- [P${i}](wiki/p${i}.md) — page ${i}`).join(
      "\n",
    );
    const result = await new ReadIndex(new FakeWikiStore({ "index.md": index }), 200).execute();
    expect(result.truncated).toBe(true);
    const [kept = "", notice] = result.index.split("\n…\n");
    expect(kept.length).toBeLessThanOrEqual(200);
    expect(index.startsWith(kept)).toBe(true);
    expect(index.split("\n")).toContain(kept.split("\n").at(-1)); // ends on a whole line
    expect(notice).toMatch(/^\[index truncated: \d+ more characters\. Use search_wiki/);
  });

  it("cuts mid-line when the first line alone is too long", async () => {
    const result = await new ReadIndex(
      new FakeWikiStore({ "index.md": "x".repeat(50) }),
      10,
    ).execute();
    expect(result.index.startsWith("xxxxxxxxxx\n…\n")).toBe(true);
  });
});
