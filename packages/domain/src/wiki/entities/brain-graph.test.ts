import { describe, expect, it } from "vitest";
import { BrainGraph, INDEX_NODE } from "./brain-graph";

const page = (title: string, body = "") =>
  `---\ntitle: ${title}\nsummary: About ${title}\n---\n\n${body}`;

describe("BrainGraph.build", () => {
  it("has an index node linked to every page index.md lists", () => {
    const graph = BrainGraph.build("- [A](wiki/a.md) — first\n- [Gone](wiki/gone.md) — x\n", [
      { path: "wiki/a.md", content: page("Alpha") },
      { path: "wiki/b.md", content: page("Beta") },
    ]);
    expect(graph.nodes).toEqual([
      { id: INDEX_NODE, title: "Index", summary: "2 articles", kind: "index", degree: 1 },
      { id: "wiki/a.md", title: "Alpha", summary: "About Alpha", kind: "page", degree: 1 },
      { id: "wiki/b.md", title: "Beta", summary: "About Beta", kind: "page", degree: 0 },
    ]);
    expect(graph.edges).toEqual([{ source: INDEX_NODE, target: "wiki/a.md" }]);
  });

  it("links pages through relative links, resolved from the linking page's folder", () => {
    const graph = BrainGraph.build(null, [
      { path: "wiki/a.md", content: page("A", "See [Ada](people/ada.md) and [B](./b.md#top).") },
      { path: "wiki/b.md", content: page("B", "Back to [A](a.md 'title').") },
      { path: "wiki/people/ada.md", content: page("Ada", "[Deploys](../b.md?x=1)") },
    ]);
    expect(graph.edges).toEqual([
      { source: "wiki/a.md", target: "wiki/people/ada.md" },
      { source: "wiki/a.md", target: "wiki/b.md" },
      { source: "wiki/people/ada.md", target: "wiki/b.md" },
    ]);
    expect(graph.nodes.find((node) => node.id === "wiki/a.md")?.degree).toBe(2);
  });

  it("accepts links written from the repo root", () => {
    const graph = BrainGraph.build("", [
      { path: "wiki/a.md", content: "[B](wiki/b.md) [B again](/wiki/b.md)" },
      { path: "wiki/b.md", content: "" },
    ]);
    expect(graph.edges).toEqual([{ source: "wiki/a.md", target: "wiki/b.md" }]);
  });

  it("ignores sources, external links, anchors, self-links, escapes and missing pages", () => {
    const graph = BrainGraph.build(null, [
      {
        path: "wiki/a.md",
        content: [
          "[source](../raw/2026-11-14-x.md)",
          "[web](https://example.com/b.md)",
          "[mail](mailto:x@y.z)",
          "[here](#section)",
          "[me](a.md)",
          "[out](../../b.md)",
          "[missing](nope.md)",
          "![image](b.md)",
        ].join("\n"),
      },
      { path: "wiki/b.md", content: "" },
    ]);
    expect(graph.edges).toEqual([]);
  });

  it("titles a page by its slug when it has no frontmatter title", () => {
    const graph = BrainGraph.build(null, [{ path: "wiki/people/ada-lovelace.md", content: "x" }]);
    expect(graph.nodes[1]).toMatchObject({ title: "ada-lovelace", summary: "" });
  });

  it("keeps a stored page whose path isn't kebab-case, with its links", () => {
    const graph = BrainGraph.build(null, [
      { path: "wiki/Old_Notes.md", content: "---\ntitle: Ignored\n---\n\n[A](a.md)" },
      { path: "wiki/a.md", content: "" },
    ]);
    expect(graph.nodes[1]).toMatchObject({ id: "wiki/Old_Notes.md", title: "Old_Notes" });
    expect(graph.edges).toEqual([{ source: "wiki/Old_Notes.md", target: "wiki/a.md" }]);
  });

  it("counts a single article", () => {
    const graph = BrainGraph.build(null, [{ path: "wiki/a.md", content: "" }]);
    expect(graph.nodes[0]?.summary).toBe("1 article");
  });
});
