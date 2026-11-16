import { InMemoryWikiStore } from "@cortex/adapters";
import { Changeset, ReadBrainGraph } from "@cortex/domain";
import { describe, expect, it } from "vitest";
import { serveBrainGraph } from "./brain-graph-route";
import { SAMPLE_BRAIN } from "./sample-brain";

const clock = { now: () => new Date() };

function setup() {
  const store = new InMemoryWikiStore({
    "index.md": "- [A](wiki/a.md) — a\n",
    "wiki/a.md": "---\ntitle: A\n---\n\n[B](b.md)",
    "wiki/b.md": "",
  });
  const allow = async (): Promise<unknown> => ({ principalId: "u" });
  const readBrainGraph = new ReadBrainGraph(store, clock, 0);
  const serve = (headers: HeadersInit = {}, authenticate = allow) =>
    serveBrainGraph(new Request("http://localhost/brain/graph", { headers }), {
      authenticate,
      readBrainGraph,
    });
  return { store, serve };
}

describe("serveBrainGraph", () => {
  it("serves the nodes and edges, tagged with the head", async () => {
    const { serve } = setup();
    const response = await serve();
    expect(response.status).toBe(200);
    expect(response.headers.get("etag")).toBe('"memory-0"');
    expect(response.headers.get("cache-control")).toBe("private, no-cache");
    const body = await response.json();
    expect(body).toMatchObject({ ok: true, ref: "memory-0" });
    expect(body.nodes.map((node: { id: string }) => node.id)).toEqual([
      "index.md",
      "wiki/a.md",
      "wiki/b.md",
    ]);
    expect(body.edges).toEqual([
      { source: "index.md", target: "wiki/a.md" },
      { source: "wiki/a.md", target: "wiki/b.md" },
    ]);
  });

  it("answers 304 while the head hasn't moved, and the new graph once it has", async () => {
    const { store, serve } = setup();
    const unchanged = await serve({ "if-none-match": '"memory-0"' });
    expect(unchanged.status).toBe(304);
    await expect(unchanged.text()).resolves.toBe("");

    await store.commit(new Changeset().write("wiki/c.md", ""), "add c");
    const changed = await serve({ "if-none-match": '"memory-0"' });
    expect(changed.status).toBe(200);
    expect(changed.headers.get("etag")).toBe('"memory-1"');
  });

  it("returns the auth failure as is", async () => {
    const { serve } = setup();
    const denied = new Response("no", { status: 401 });
    expect(await serve({}, async () => denied)).toBe(denied);
  });

  it("links every sample page into one graph", async () => {
    const view = await new ReadBrainGraph(
      new InMemoryWikiStore({ ...SAMPLE_BRAIN }),
      clock,
    ).execute();
    const pages = view.graph.nodes.filter((node) => node.kind === "page");
    expect(pages.length).toBeGreaterThan(25);
    expect(pages.filter((node) => node.degree === 0)).toEqual([]);
  });
});
