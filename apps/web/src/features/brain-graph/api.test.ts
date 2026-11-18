import type { EveMessage } from "eve/react";
import { describe, expect, it } from "vitest";
import {
  brainGraphUrl,
  brainPageUrl,
  brainTrail,
  neighbours,
  nodeRadius,
  nodeSlug,
  parseBrainGraph,
  parseBrainPage,
  READER_LINK_TAG,
  readerLink,
  readerTarget,
  rehypeReaderLinks,
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

describe("brain reader api", () => {
  const step = (path: string, action: "read" | "search" | "write") =>
    ({ id: `${path}:${action}`, path, action, active: false }) as const;

  it("builds the page URL", () => {
    expect(brainPageUrl("companion", "wiki/team/on-call.md")).toBe(
      "/eve/companion/brain/page?path=wiki%2Fteam%2Fon-call.md",
    );
  });

  it("parses a page body and refuses anything else", () => {
    const page = {
      ok: true,
      ref: "r1",
      path: "wiki/a.md",
      title: "A",
      summary: "s",
      updated: "2026-11-10",
      body: "# A",
    };
    expect(parseBrainPage(page)).toEqual({
      ref: "r1",
      path: "wiki/a.md",
      title: "A",
      summary: "s",
      updated: "2026-11-10",
      body: "# A",
    });
    expect(parseBrainPage({ ...page, body: 1 })).toBeUndefined();
    expect(parseBrainPage(null)).toBeUndefined();
  });

  it("follows the page the agent last read or wrote, not what it found", () => {
    expect(readerTarget([])).toBeUndefined();
    expect(
      readerTarget([
        step("wiki/a.md", "read"),
        step("wiki/b.md", "write"),
        step("wiki/c.md", "search"),
      ]),
    ).toBe("wiki/b.md");
  });

  it("resolves a link in a page to another page of the brain", () => {
    expect(readerLink("wiki/team/on-call.md", "../deploys.md")).toBe("wiki/deploys.md");
    expect(readerLink("index.md", "wiki/deploys.md#x")).toBe("wiki/deploys.md");
    expect(readerLink("wiki/a.md", "/index.md")).toBe("index.md");
    expect(readerLink("wiki/a.md", "../raw/2026-11-10-x.md")).toBeUndefined();
    expect(readerLink("wiki/a.md", "Bad Name.md")).toBeUndefined();
    expect(readerLink("wiki/a.md", "https://example.com")).toBeUndefined();
  });

  it("turns page links into reader links, after sanitizing", () => {
    const tree = {
      type: "root",
      children: [
        { type: "element", tagName: "a", properties: { href: "b.md" }, children: [] },
        { type: "element", tagName: "a", properties: { href: "https://x.dev" }, children: [] },
        { type: "element", tagName: "a", properties: {} },
      ],
    };
    rehypeReaderLinks("wiki/a.md")()(tree);
    expect(tree.children.map((child) => [child.tagName, child.properties])).toEqual([
      [READER_LINK_TAG, { path: "wiki/b.md" }],
      ["a", { href: "https://x.dev" }],
      ["a", {}],
    ]);
  });
});
