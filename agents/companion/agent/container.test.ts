import {
  GitHubWikiStore,
  InMemorySessionIndex,
  InMemoryWikiStore,
  ReadOnlyWikiStore,
  UpstashSessionIndex,
} from "@cortex/adapters";
import { afterEach, describe, expect, it } from "vitest";
import { container, createContainer, useContainer } from "./container";
import { DESIGN_KIT_FILES } from "./lib/design-kit";

afterEach(() => useContainer(undefined));

describe("createContainer session index (ADR-0013)", () => {
  const upstash = {
    UPSTASH_REDIS_REST_URL: "https://db.upstash.io",
    UPSTASH_REDIS_REST_TOKEN: "t",
  };

  it("is in memory without Upstash settings", () => {
    expect(createContainer({}).sessionIndex).toBeInstanceOf(InMemorySessionIndex);
    const onlyUrl = { UPSTASH_REDIS_REST_URL: upstash.UPSTASH_REDIS_REST_URL };
    expect(createContainer(onlyUrl).sessionIndex).toBeInstanceOf(InMemorySessionIndex);
  });

  it("uses Upstash when both the URL and the token are set", () => {
    expect(createContainer(upstash).sessionIndex).toBeInstanceOf(UpstashSessionIndex);
  });

  it("SESSIONS_STORE=memory forces the in-memory index", () => {
    const env = { ...upstash, SESSIONS_STORE: "memory" };
    expect(createContainer(env).sessionIndex).toBeInstanceOf(InMemorySessionIndex);
  });

  it("wires the session use-cases to the same index", async () => {
    const c = createContainer({});
    await c.recordSessionActivity.execute({
      owner: "u",
      sessionId: "s",
      message: "Hello",
      at: new Date(),
    });
    await expect(c.listSessions.execute("u")).resolves.toMatchObject([{ title: "Hello" }]);
    await c.renameSession.execute("u", "s", "Renamed");
    await expect(c.sessionIndex.get("u", "s")).resolves.toMatchObject({ title: "Renamed" });
    await c.removeSession.execute("u", "s", { end: async () => {} });
    await expect(c.listSessions.execute("u")).resolves.toEqual([]);
  });
});

describe("createContainer", () => {
  it("uses the in-memory brain, seeded with the starter files, without GitHub settings", async () => {
    const c = createContainer({});
    expect(c.wikiStore).toBeInstanceOf(InMemoryWikiStore);
    await expect(c.wikiStore.readFile("AGENTS.md")).resolves.toMatch(/^# Brain schema/);
    await expect(c.listPages.execute()).resolves.toEqual(["wiki/welcome.md"]);
  });

  it("uses GitHub when both BRAIN_GITHUB_TOKEN and BRAIN_REPO are set", () => {
    const c = createContainer({ BRAIN_GITHUB_TOKEN: "t", BRAIN_REPO: "polive106/brain" });
    expect(c.wikiStore).toBeInstanceOf(GitHubWikiStore);
  });

  it("stays in memory when only one of them is set", () => {
    expect(createContainer({ BRAIN_GITHUB_TOKEN: "t" }).wikiStore).toBeInstanceOf(
      InMemoryWikiStore,
    );
    expect(createContainer({ BRAIN_REPO: "a/b" }).wikiStore).toBeInstanceOf(InMemoryWikiStore);
  });

  it("BRAIN_STORE=memory forces the in-memory brain even with GitHub settings", () => {
    const env = { BRAIN_GITHUB_TOKEN: "t", BRAIN_REPO: "polive106/brain", BRAIN_STORE: "memory" };
    expect(createContainer(env).wikiStore).toBeInstanceOf(InMemoryWikiStore);
  });

  it("is read-only in hosted builds without GitHub settings, so writes can't silently vanish", () => {
    for (const VERCEL_ENV of ["production", "preview"]) {
      expect(createContainer({ VERCEL_ENV }).wikiStore).toBeInstanceOf(ReadOnlyWikiStore);
    }
    expect(createContainer({ VERCEL_ENV: "development" }).wikiStore).toBeInstanceOf(
      InMemoryWikiStore,
    );
  });

  it("publishes artifacts with Tailwind on the design kit's theme", async () => {
    const c = createContainer({});
    const source = DESIGN_KIT_FILES["design/template.html"] as string;
    const result = await c.publishArtifact.execute({ slug: "demo", title: "Demo", source });
    expect(result).toMatchObject({ path: "out/demo.html", version: 1 });
    const html = (await c.wikiStore.readFile("out/demo.html")) as string;
    expect(html).toContain("--card: oklch(1 0 0)");
    expect(html).toContain(".bg-card");
    expect(html).toContain(".md\\:grid-cols-3");
    expect(html).toContain("prefers-color-scheme: dark");
  });

  it("refuses a malformed BRAIN_REPO instead of guessing", () => {
    expect(() => createContainer({ BRAIN_GITHUB_TOKEN: "t", BRAIN_REPO: "brain" })).toThrow(
      /BRAIN_REPO must be "owner\/repo"/,
    );
  });
});

describe("container", () => {
  it("builds once per process, and tests can swap it", () => {
    expect(container()).toBe(container());
    const fake = createContainer({});
    useContainer(fake);
    expect(container()).toBe(fake);
  });
});
