import { describe, expect, it } from "vitest";
import { brainGraphUrl, neighbours, nodeRadius, nodeSlug, parseBrainGraph } from "./api";

const node = (id: string, kind = "page") => ({ id, title: id, summary: "", kind, degree: 1 });

describe("brain graph api", () => {
  it("builds the route URL", () => {
    expect(brainGraphUrl("companion")).toBe("/eve/companion/brain/graph");
  });

  it("slugs node ids for test ids", () => {
    expect(nodeSlug("index.md")).toBe("index");
    expect(nodeSlug("wiki/team/on-call.md")).toBe("team-on-call");
  });

  it("keeps well-formed nodes and the edges between them", () => {
    const graph = parseBrainGraph({
      ok: true,
      ref: "abc",
      nodes: [node("index.md", "index"), node("wiki/a.md"), { id: "bad" }, null],
      edges: [
        { source: "index.md", target: "wiki/a.md", extra: 1 },
        { source: "wiki/a.md", target: "wiki/missing.md" },
        { source: 1 },
        null,
      ],
    });
    expect(graph).toEqual({
      ref: "abc",
      nodes: [node("index.md", "index"), node("wiki/a.md")],
      edges: [{ source: "index.md", target: "wiki/a.md" }],
    });
  });

  it("refuses a body without a ref or nodes, and tolerates missing edges", () => {
    expect(parseBrainGraph(null)).toBeUndefined();
    expect(parseBrainGraph({ ref: "a" })).toBeUndefined();
    expect(parseBrainGraph({ nodes: [] })).toBeUndefined();
    expect(parseBrainGraph({ ref: "a", nodes: [] })).toEqual({ ref: "a", nodes: [], edges: [] });
  });

  it("maps each node to its neighbours", () => {
    const map = neighbours([
      { source: "a", target: "b" },
      { source: "a", target: "c" },
    ]);
    expect([...(map.get("a") ?? [])]).toEqual(["b", "c"]);
    expect([...(map.get("c") ?? [])]).toEqual(["a"]);
  });

  it("sizes the hub largest and pages by links, capped", () => {
    expect(nodeRadius({ kind: "index", degree: 0 })).toBe(30);
    expect(nodeRadius({ kind: "page", degree: 0 })).toBe(5);
    expect(nodeRadius({ kind: "page", degree: 20 })).toBe(nodeRadius({ kind: "page", degree: 6 }));
  });
});
