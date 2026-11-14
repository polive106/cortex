import { describe, expect, it } from "vitest";
import { Source } from "./source";
import { SourcePath } from "./source-path";

describe("Source", () => {
  it("serializes an immutable raw file with provenance", () => {
    const source = new Source({
      path: SourcePath.parse("raw/2026-11-14-deploy-notes.md"),
      title: "Deploy notes",
      origin: "https://example.com/deploys",
      captured: "2026-11-14",
      text: "We deploy on push.\n",
    });
    expect(source.serialize()).toBe(
      "---\ntitle: Deploy notes\norigin: https://example.com/deploys\ncaptured: 2026-11-14\n---\n\nWe deploy on push.\n",
    );
  });

  it("flattens newlines in the title and origin", () => {
    const source = new Source({
      path: SourcePath.parse("raw/2026-11-14-a.md"),
      title: "A\nB",
      origin: "pasted\ntext",
      captured: "2026-11-14",
      text: "x",
    });
    expect(source.serialize()).toContain("title: A B\norigin: pasted text\n");
  });
});
