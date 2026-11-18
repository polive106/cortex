import { InMemoryWikiStore } from "@cortex/adapters";
import { ReadBrainPage } from "@cortex/domain";
import { describe, expect, it } from "vitest";
import { serveBrainPage } from "./brain-page-route";

function setup() {
  const store = new InMemoryWikiStore({
    "AGENTS.md": "# Schema",
    "index.md": "- [A](wiki/a.md) — a\n",
    "wiki/a.md": "---\ntitle: A\nsummary: The a page\nupdated: 2026-11-10\n---\n\n[B](b.md)",
  });
  const allow = async (): Promise<unknown> => ({ principalId: "u" });
  const serve = (query: string, authenticate = allow) =>
    serveBrainPage(new Request(`http://localhost/brain/page${query}`), {
      authenticate,
      readBrainPage: new ReadBrainPage(store),
    });
  return { serve };
}

describe("serveBrainPage", () => {
  it("serves a page with the head it was read at", async () => {
    const { serve } = setup();
    const response = await serve("?path=wiki/a.md");
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      ok: true,
      ref: "memory-0",
      path: "wiki/a.md",
      title: "A",
      summary: "The a page",
      updated: "2026-11-10",
      body: "[B](b.md)",
    });
  });

  it("serves the index", async () => {
    const { serve } = setup();
    const body = await (await serve("?path=index.md")).json();
    expect(body).toMatchObject({ ok: true, path: "index.md", title: "Index" });
  });

  it("refuses a missing or invalid path, and says when a page doesn't exist", async () => {
    const { serve } = setup();
    expect((await serve("")).status).toBe(400);
    expect((await serve("?path=AGENTS.md")).status).toBe(400);
    const missing = await serve("?path=wiki/nope.md");
    expect(missing.status).toBe(404);
    await expect(missing.json()).resolves.toMatchObject({ ok: false });
  });

  it("returns the auth failure as is", async () => {
    const { serve } = setup();
    const denied = new Response("no", { status: 401 });
    expect(await serve("?path=wiki/a.md", async () => denied)).toBe(denied);
  });
});
