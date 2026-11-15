import { InMemoryArtifactBuilder, InMemoryWikiStore } from "@cortex/adapters";
import { PublishArtifact, ReadArtifact } from "@cortex/domain";
import { describe, expect, it } from "vitest";
import { serveArtifact } from "./artifact-route";

async function setup() {
  const store = new InMemoryWikiStore();
  const publish = new PublishArtifact(store, new InMemoryArtifactBuilder(), {
    now: () => new Date("2026-11-15T00:00:00Z"),
  });
  const v1 = await publish.execute({ slug: "plan", title: "Plan", source: "<p>one</p>" });
  await publish.execute({ slug: "plan", title: "Plan", source: "<p>two</p>" });
  const allow = async (): Promise<unknown> => ({ principalId: "u" });
  const serve = (query: string, authenticate: (request: Request) => Promise<unknown> = allow) =>
    serveArtifact(new Request(`http://localhost/artifacts${query}`), {
      authenticate,
      readArtifact: new ReadArtifact(store),
    });
  return { serve, firstRef: v1.ref as string };
}

describe("serveArtifact", () => {
  it("serves the latest page as sandboxed HTML", async () => {
    const { serve } = await setup();
    const response = await serve("?path=out/plan.html");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(response.headers.get("content-security-policy")).toMatch(
      /^sandbox allow-scripts; default-src 'none'/,
    );
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("cache-control")).toBe("private, no-cache");
    await expect(response.text()).resolves.toContain("<p>two</p>");
  });

  it("serves an earlier version by commit, cached for good", async () => {
    const { serve, firstRef } = await setup();
    const response = await serve(`?path=out/plan.html&ref=${firstRef}`);
    expect(response.headers.get("cache-control")).toBe("private, max-age=31536000, immutable");
    await expect(response.text()).resolves.toContain("<p>one</p>");
  });

  it("answers 400 for a missing or invalid path, and 404 for a missing artifact", async () => {
    const { serve } = await setup();
    expect((await serve("")).status).toBe(400);
    expect((await serve("?path=wiki/welcome.md")).status).toBe(400);
    expect((await serve("?path=out/nope.html")).status).toBe(404);
    expect((await serve("?path=out/plan.html&ref=unknown")).status).toBe(404);
  });

  it("returns the auth failure as is, before reading anything", async () => {
    const { serve } = await setup();
    const denied = new Response("no", { status: 401 });
    expect(await serve("?path=out/plan.html", async () => denied)).toBe(denied);
  });

  it("lets other failures through", async () => {
    const failing = { execute: async () => Promise.reject(new Error("GitHub is down")) };
    const request = new Request("http://localhost/artifacts?path=out/plan.html");
    await expect(
      serveArtifact(request, {
        authenticate: async () => ({}),
        readArtifact: failing as unknown as ReadArtifact,
      }),
    ).rejects.toThrow("GitHub is down");
  });
});
