import { describe, expect, it } from "vitest";
import { PagePath } from "./page-path";
import { IndexEntry, WikiIndex } from "./wiki-index";

const INDEX = [
  "# Index",
  "",
  "Every page, one line each.",
  "",
  "- [Deploys](wiki/deploys.md) — How we ship",
  "- [People](wiki/people.md) — Who does what",
  "",
].join("\n");

const entry = (path: string, title: string, summary: string) =>
  new IndexEntry({ path: PagePath.parse(path), title, summary });

describe("WikiIndex", () => {
  it("parses entries and keeps the other lines", () => {
    const index = WikiIndex.parse(INDEX);
    expect(index.entries.map((e) => e.path.value)).toEqual(["wiki/deploys.md", "wiki/people.md"]);
    expect(index.serialize()).toBe(INDEX);
  });

  it("upserts in place: one line per page, with the new summary", () => {
    const index = WikiIndex.parse(INDEX).upsert(
      entry("wiki/deploys.md", "Deploys", "Deploy on push"),
    );
    expect(index.serialize()).toBe(INDEX.replace("— How we ship", "— Deploy on push"));
    expect(index.entries).toHaveLength(2);
  });

  it("appends a new page after the last entry", () => {
    const index = WikiIndex.parse(INDEX).upsert(entry("wiki/ci.md", "CI", "Checks on every push"));
    expect(index.serialize()).toBe(
      INDEX.replace(
        "Who does what\n",
        "Who does what\n- [CI](wiki/ci.md) — Checks on every push\n",
      ),
    );
  });

  it("appends to an index with no entries yet", () => {
    expect(
      WikiIndex.parse("# Index\n")
        .upsert(entry("wiki/a.md", "A", "a"))
        .serialize(),
    ).toBe("# Index\n- [A](wiki/a.md) — a\n");
    expect(
      WikiIndex.parse("")
        .upsert(entry("wiki/a.md", "A", "a"))
        .serialize(),
    ).toBe("- [A](wiki/a.md) — a\n");
  });

  it("serializes an empty index as an empty file", () => {
    expect(WikiIndex.parse("").serialize()).toBe("");
  });

  it("keeps a malformed entry line as plain text instead of failing", () => {
    const index = WikiIndex.parse("- [Bad](raw/x.md) — not a page\n");
    expect(index.entries).toEqual([]);
    expect(index.serialize()).toBe("- [Bad](raw/x.md) — not a page\n");
  });

  it("flattens brackets and newlines so a title can't break the line format", () => {
    expect(entry("wiki/a.md", "A [b]\nc", "x\ny").line()).toBe("- [A (b) c](wiki/a.md) — x y");
  });
});
