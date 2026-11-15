import { describe, expect, it } from "vitest";
import { InvalidPathError } from "../../wiki/errors";
import { FakeWikiStore, fixedClock } from "../../wiki/testing/fake-wiki-store";
import { Artifact } from "../entities/artifact";
import { ArtifactPath } from "../entities/artifact-path";
import { InvalidArtifactError } from "../errors";
import type { ArtifactBuilder } from "../ports/artifact-builder";
import { PublishArtifact } from "./publish-artifact";

const page = (text: string) =>
  `<!doctype html><html><head><title>Roadmap</title></head><body class="p-4">${text}</body></html>`;

function setup(files: Record<string, string> = { "log.md": "# Log\n" }) {
  const store = new FakeWikiStore(files);
  const built: string[] = [];
  const builder: ArtifactBuilder = {
    async css(html) {
      built.push(html);
      return ".p-4{padding:1rem}";
    },
  };
  return { store, built, publish: new PublishArtifact(store, builder, fixedClock()) };
}

const request = { slug: "roadmap", project: "acme", title: "Roadmap", source: page("v1") };

describe("PublishArtifact", () => {
  it("publishes version 1 as one commit with a log entry", async () => {
    const { store, publish } = setup();
    await expect(publish.execute(request)).resolves.toEqual({
      path: "out/acme/roadmap.html",
      title: "Roadmap",
      version: 1,
      ref: "commit-1",
      changed: true,
    });
    expect(store.commits).toEqual([
      { message: "artifact: Roadmap v1", paths: ["out/acme/roadmap.html", "log.md"] },
    ]);
    const html = store.files["out/acme/roadmap.html"] as string;
    expect(html).toContain('<meta name="cortex:version" content="1">');
    expect(html).toContain(".p-4{padding:1rem}");
    expect(store.files["log.md"]).toBe(
      "# Log\n\n## [2026-11-14] publish | Roadmap\n\n- out/acme/roadmap.html v1\n",
    );
  });

  it("starts the log when there is none, and works without a project", async () => {
    const { store, publish } = setup({});
    await publish.execute({ ...request, project: undefined });
    expect(store.files["log.md"]).toBe(
      "## [2026-11-14] publish | Roadmap\n\n- out/roadmap.html v1\n",
    );
  });

  it("bumps the version on every change", async () => {
    const { store, publish } = setup();
    await publish.execute(request);
    await expect(publish.execute({ ...request, source: page("v2") })).resolves.toMatchObject({
      version: 2,
      ref: "commit-2",
      changed: true,
    });
    expect(store.files["out/acme/roadmap.html"]).toContain("v2");
  });

  it("accepts the rendered page back and builds CSS from the source alone", async () => {
    const { store, built, publish } = setup();
    await publish.execute(request);
    const rendered = store.files["out/acme/roadmap.html"] as string;
    await publish.execute({ ...request, source: rendered.replace("v1", "v2") });
    expect(built[1]).not.toContain("cortex:artifact");
    expect(store.files["out/acme/roadmap.html"]).toContain('content="2"');
  });

  it("commits nothing, and builds nothing, when the page didn't change", async () => {
    const { store, built, publish } = setup();
    await publish.execute(request);
    await expect(publish.execute(request)).resolves.toEqual({
      path: "out/acme/roadmap.html",
      title: "Roadmap",
      version: 1,
      changed: false,
    });
    expect(store.commits).toHaveLength(1);
    expect(built).toHaveLength(1);
  });

  it("continues the version of a file edited by hand", async () => {
    const path = ArtifactPath.of("roadmap", "acme");
    const v3 = Artifact.create({ path, title: "R", version: 3, source: page("old") }).render("");
    const { publish } = setup({ "out/acme/roadmap.html": v3 });
    await expect(publish.execute(request)).resolves.toMatchObject({ version: 4 });
  });

  it("re-plans once when the brain moved", async () => {
    const { store, built, publish } = setup();
    store.headMovesFor = 1;
    await expect(publish.execute(request)).resolves.toMatchObject({ version: 1 });
    expect(store.commits).toHaveLength(1);
    expect(built).toHaveLength(1);
  });

  it("gives up after a second conflict", async () => {
    const { store, publish } = setup();
    store.headMovesFor = 2;
    await expect(publish.execute(request)).rejects.toThrow("moved");
  });

  it("refuses an invalid slug or source before building anything", async () => {
    const { store, built, publish } = setup();
    await expect(publish.execute({ ...request, slug: "Road Map" })).rejects.toThrow(
      InvalidPathError,
    );
    await expect(
      publish.execute({ ...request, source: '<script src="https://x.example/a.js"></script>' }),
    ).rejects.toThrow(InvalidArtifactError);
    expect(built).toHaveLength(0);
    expect(store.commits).toHaveLength(0);
  });

  it("lets other errors through without retrying", async () => {
    const { store, publish } = setup();
    store.commit = async () => {
      throw new Error("GitHub is down");
    };
    await expect(publish.execute(request)).rejects.toThrow("GitHub is down");
  });
});
