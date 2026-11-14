import { describe, expect, it } from "vitest";
import { FakeWikiStore } from "../testing/fake-wiki-store";
import { SearchWiki } from "./search-wiki";

const page = (title: string, body: string) => `---\ntitle: ${title}\nsummary: s\n---\n\n${body}`;

const store = new FakeWikiStore({
  "wiki/deploys.md": page("Deploys", "We deploy on push. Deploy previews run per branch."),
  "wiki/ci.md": page("CI", "CI runs checks before every deploy."),
  "wiki/people.md": page("People", "Ada owns the release calendar."),
  "raw/2026-11-14-deploy.md": "deploy deploy deploy",
});

describe("SearchWiki", () => {
  it("ranks pages by term hits, boosting title matches, and skips raw/", async () => {
    const results = await new SearchWiki(store).execute("deploy");
    expect(results.map((r) => r.path)).toEqual(["wiki/deploys.md", "wiki/ci.md"]);
    expect(results[0]).toMatchObject({ title: "Deploys" });
    expect(results[0]?.score).toBeGreaterThan(results[1]?.score ?? 0);
  });

  it("returns a snippet around the first match", async () => {
    const [ci] = await new SearchWiki(store).execute("checks");
    expect(ci?.snippet).toBe("CI runs checks before every deploy.");
  });

  it("starts the snippet at the top when only the title matches", async () => {
    const titleOnly = new FakeWikiStore({ "wiki/r.md": page("Releases", "Monthly cadence.") });
    const [hit] = await new SearchWiki(titleOnly).execute("releases");
    expect(hit).toMatchObject({ snippet: "Monthly cadence.", score: 3 });
  });

  it("marks cut snippets with ellipses", async () => {
    const long = new FakeWikiStore({
      "wiki/long.md": page("Long", `${"a ".repeat(100)}needle${" b".repeat(100)}`),
    });
    const [hit] = await new SearchWiki(long).execute("needle");
    expect(hit?.snippet.startsWith("…")).toBe(true);
    expect(hit?.snippet.endsWith("…")).toBe(true);
    expect(hit?.snippet).toContain("needle");
  });

  it("caps the number of results and breaks ties by path", async () => {
    const tied = new FakeWikiStore({ "wiki/b.md": "xy", "wiki/a.md": "xy", "wiki/c.md": "xy" });
    const results = await new SearchWiki(tied).execute("xy", 2);
    expect(results.map((r) => r.path)).toEqual(["wiki/a.md", "wiki/b.md"]);
  });

  it("ignores very short terms and returns nothing for an empty query", async () => {
    await expect(new SearchWiki(store).execute("a ")).resolves.toEqual([]);
  });

  it("ignores store results with invalid page paths", async () => {
    const odd = new FakeWikiStore({ "wiki/Bad Name.md": "deploy" });
    await expect(new SearchWiki(odd).execute("deploy")).resolves.toEqual([]);
  });

  it("drops pages that match no term", async () => {
    await expect(new SearchWiki(store).execute("kubernetes")).resolves.toEqual([]);
  });
});
