import type { EveMessage } from "eve/react";
import { describe, expect, it } from "vitest";
import {
  brainGraphUrl,
  brainTrail,
  neighbours,
  nodeRadius,
  nodeSlug,
  parseBrainGraph,
} from "./api";

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

const tool = (callId: string, name: string, state: string, input: unknown, output?: unknown) => ({
  type: "tool",
  callId,
  stepIndex: 0,
  kind: "tool",
  name,
  label: name,
  state,
  input,
  output,
});
const conversation = (...parts: ReturnType<typeof tool>[]) =>
  [{ id: "m1", role: "assistant", parts }] as unknown as EveMessage[];

const stepsOf = (messages: EveMessage[]) => brainTrail(messages).steps;

describe("brainTrail", () => {
  it("shows a read as soon as it starts, active until it's done", () => {
    const running = stepsOf(
      conversation(tool("c1", "read_page", "running", { path: "wiki/a.md" })),
    );
    expect(running).toEqual([
      { id: "c1:wiki/a.md", path: "wiki/a.md", action: "read", active: true },
    ]);
    const done = stepsOf(
      conversation(
        tool("c1", "read_page", "completed", { path: "wiki/a.md" }, { path: "wiki/a.md" }),
      ),
    );
    expect(done[0]?.active).toBe(false);
    const twice = stepsOf(
      conversation(
        tool("c1", "read_page", "completed", { path: "wiki/a.md" }, {}),
        tool("c2", "read_page", "running", { path: "wiki/a.md" }),
      ),
    );
    expect(twice).toEqual([
      { id: "c1:wiki/a.md", path: "wiki/a.md", action: "read", active: true },
    ]);
  });

  it("takes a search's top hits and a write's changed pages, once they're done", () => {
    const trail = stepsOf(
      conversation(
        tool("s0", "search_wiki", "running", { query: "x" }),
        tool(
          "s1",
          "search_wiki",
          "completed",
          { query: "x" },
          {
            results: ["a", "b", "c", "d"].map((slug) => ({ path: `wiki/${slug}.md` })),
          },
        ),
        tool(
          "w1",
          "write_page",
          "completed",
          {},
          {
            committed: true,
            changes: ["update wiki/c.md", "create wiki/new.md"],
          },
        ),
      ),
    );
    expect(trail.map((step) => `${step.action} ${step.path}`)).toEqual([
      "search wiki/a.md",
      "search wiki/b.md",
      "search wiki/c.md",
      "write wiki/c.md",
      "write wiki/new.md",
    ]);
  });

  it("skips errors, other tools, streaming calls, and paths that aren't pages", () => {
    const trail = stepsOf([
      { id: "u", role: "user", parts: [{ type: "text", text: "hi" }] },
      ...conversation(
        tool("e", "read_page", "completed", { path: "wiki/a.md" }, { error: "PageNotFoundError" }),
        tool("o", "publish_artifact", "completed", {}, { path: "out/a.html" }),
        tool("p", "read_page", "running", { path: "AGENTS.md" }),
        tool("q", "read_page", "streaming", undefined),
        tool("r", "search_wiki", "completed", {}, { results: "nope" }),
        tool("w", "write_page", "completed", {}, {}),
      ),
    ] as unknown as EveMessage[]);
    expect(trail).toEqual([]);
  });

  it("remembers the commit of the latest write", () => {
    const write = (callId: string, ref?: string) =>
      tool(callId, "write_page", "completed", {}, { committed: true, changes: [], ref });
    expect(brainTrail(conversation(write("w1", "a"), write("w2", "b"))).written).toBe("b");
    expect(brainTrail(conversation(write("w1"))).written).toBeUndefined();
  });
});
