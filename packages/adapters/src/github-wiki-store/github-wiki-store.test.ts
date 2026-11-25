import { Changeset, ConflictError } from "@cortex/domain";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { CONTRACT_SEED, describeWikiStoreContract } from "../contracts/wiki-store-contract";
import { FakeGitHub } from "../testing/fake-github";
import { GitHubWikiStore } from "./github-wiki-store";

const TOKEN = "github_pat_test_SECRET_123";
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const connect = (github: FakeGitHub, token = TOKEN) =>
  new GitHubWikiStore({
    token,
    owner: "acme",
    repo: "brain",
    branch: "main",
    apiUrl: github.api,
  });

const fakeGitHub = () => {
  const github = new FakeGitHub(TOKEN, CONTRACT_SEED);
  server.use(...github.handlers());
  return github;
};

describeWikiStoreContract("GitHubWikiStore", async () => connect(fakeGitHub()));

describe("GitHubWikiStore", () => {
  it("commits a whole changeset as one commit and one ref update", async () => {
    const github = fakeGitHub();
    const changeset = new Changeset()
      .write("raw/2026-11-15-a.md", "a", { mustNotExist: true })
      .write("wiki/a.md", "a")
      .write("index.md", "i")
      .write("log.md", "l");
    const { ref } = await connect(github).commit(changeset, "ingest: A");
    expect(github.calls.filter((call) => call === "POST /git/commits")).toHaveLength(1);
    expect(
      github.calls.filter((call) => call.startsWith("PATCH /git/refs/heads/main")),
    ).toHaveLength(1);
    expect(ref).toMatch(/^commit/);
    expect(github.files["wiki/a.md"]).toBe("a");
  });

  it("raises ConflictError when the head moved, without replaying stale writes", async () => {
    const github = fakeGitHub();
    github.headMovesFor = 1;
    await expect(
      connect(github).commit(new Changeset().write("index.md", "stale"), "x"),
    ).rejects.toThrow(ConflictError);
    expect(github.files["index.md"]).toBe(CONTRACT_SEED["index.md"]);
  });

  it("skips the tree listing when no write has a precondition", async () => {
    const github = fakeGitHub();
    await connect(github).commit(new Changeset().write("index.md", "i"), "x");
    expect(github.calls.some((call) => call.startsWith("GET /git/trees"))).toBe(false);
  });

  it("never puts the token in errors", async () => {
    const github = fakeGitHub();
    const store = connect(github, "github_pat_WRONG_456");
    const error = await store.readFile("AGENTS.md").catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(Error);
    expect(String((error as Error).message)).toMatch(
      /GitHub GET \/contents\/AGENTS\.md failed: 401/,
    );
    expect(String((error as Error).message)).not.toContain("WRONG_456");
    expect(JSON.stringify(error)).not.toContain("WRONG_456");
  });

  it("sends the token only as a bearer header to the configured API", async () => {
    let seen: Headers | undefined;
    server.use(
      http.get("https://api.github.test/repos/acme/brain/contents/*", ({ request }) => {
        seen = request.headers;
        return HttpResponse.text("x");
      }),
    );
    const store = new GitHubWikiStore({
      token: TOKEN,
      owner: "acme",
      repo: "brain",
      apiUrl: "https://api.github.test",
    });
    await store.readFile("AGENTS.md");
    expect(seen?.get("authorization")).toBe(`Bearer ${TOKEN}`);
    expect(seen?.get("accept")).toBe("application/vnd.github.raw+json");
  });

  it("reads null for a malformed ref instead of failing", async () => {
    const store = connect(fakeGitHub());
    await expect(store.readFile("out/roadmap.html", "malformed")).resolves.toBeNull();
  });

  it("URL-encodes each path segment", async () => {
    let path = "";
    server.use(
      http.get("https://api.github.test/repos/acme/brain/contents/*", ({ request }) => {
        path = new URL(request.url).pathname;
        return HttpResponse.text("x");
      }),
    );
    await connect(new FakeGitHub(TOKEN, {})).readFile("wiki/a b#c.md");
    expect(path).toBe("/repos/acme/brain/contents/wiki/a%20b%23c.md");
  });

  it("fails loudly when GitHub truncates the tree listing", async () => {
    server.use(
      http.get("https://api.github.test/repos/acme/brain/git/trees/:ref", () =>
        HttpResponse.json({ truncated: true, tree: [] }),
      ),
    );
    await expect(connect(new FakeGitHub(TOKEN, {})).listPages()).rejects.toThrow(/truncated/);
  });

  it("reports other failures without the token hint", async () => {
    server.use(
      http.get("https://api.github.test/repos/acme/brain/contents/*", () =>
        HttpResponse.json({ message: "boom" }, { status: 500 }),
      ),
    );
    await expect(connect(new FakeGitHub(TOKEN, {})).readFile("AGENTS.md")).rejects.toThrow(
      /^GitHub GET \/contents\/AGENTS\.md failed: 500$/,
    );
  });

  it("skips a page that disappears between listing and reading", async () => {
    const github = fakeGitHub();
    server.use(
      http.get("https://api.github.test/repos/acme/brain/contents/wiki/people/ada.md", () =>
        HttpResponse.json({ message: "Not Found" }, { status: 404 }),
      ),
    );
    const pages = await connect(github).readPages();
    expect(pages.map((page) => page.path)).toEqual(["wiki/deploys.md"]);
  });

  it("defaults to api.github.com, main, and the global fetch", async () => {
    const requested: string[] = [];
    const spy: typeof fetch = async (input) => {
      requested.push(String(input));
      return new Response("x");
    };
    await new GitHubWikiStore({ token: TOKEN, owner: "o", repo: "r", fetch: spy }).readFile("a.md");
    expect(requested).toEqual(["https://api.github.com/repos/o/r/contents/a.md?ref=main"]);
    expect(new GitHubWikiStore({ token: TOKEN, owner: "o", repo: "r" })).toBeInstanceOf(
      GitHubWikiStore,
    );
  });

  it("rejects an empty changeset before calling GitHub", async () => {
    const github = fakeGitHub();
    await expect(connect(github).commit(new Changeset(), "x")).rejects.toThrow(/empty/);
    expect(github.calls).toEqual([]);
  });
});
