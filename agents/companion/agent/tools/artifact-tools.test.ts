import { InMemoryArtifactBuilder, InMemoryWikiStore } from "@cortex/adapters";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createContainer, useContainer } from "../container";
import listArtifacts from "./list_artifacts";
import openArtifact from "./open_artifact";
import publishArtifact from "./publish_artifact";

type Run = (input: unknown, ctx?: unknown) => Promise<unknown>;
const run = (tool: { execute?: unknown }) => tool.execute as Run;

/** The slice of eve's sandbox the tools use, over a plain map. */
function fakeSandbox(files: Record<string, string> = {}) {
  return {
    files,
    async readTextFile({ path }: { path: string }) {
      return files[path] ?? null;
    },
    async writeTextFile({ path, content }: { path: string; content: string }) {
      files[path] = content;
    },
  };
}

const page = (text: string) =>
  `<!doctype html><html><head><title>Plan</title></head><body class="p-4">${text}</body></html>`;

let store: InMemoryWikiStore;
let builder: InMemoryArtifactBuilder;
beforeEach(() => {
  builder = new InMemoryArtifactBuilder(".p-4{padding:1rem}");
  const c = createContainer({}, { builder });
  store = c.wikiStore as InMemoryWikiStore;
  useContainer(c);
});
afterEach(() => useContainer(undefined));

describe("publish_artifact", () => {
  it("publishes the sandbox page as a new version", async () => {
    const sandbox = fakeSandbox({ "artifacts/plan/index.html": page("v1") });
    const ctx = { getSandbox: async () => sandbox };
    const input = { slug: "plan", title: "Plan", project: "acme" };
    await expect(run(publishArtifact)(input, ctx)).resolves.toEqual({
      published: true,
      path: "out/acme/plan.html",
      title: "Plan",
      version: 1,
      ref: "memory-1",
      changed: true,
    });
    sandbox.files["artifacts/plan/index.html"] = page("v2");
    await expect(run(publishArtifact)(input, ctx)).resolves.toMatchObject({ version: 2 });
    await expect(store.readFile("out/acme/plan.html")).resolves.toContain(".p-4{padding:1rem}");
    expect(builder.built).toHaveLength(2);
  });

  it("says where to write the page when it's missing", async () => {
    const ctx = { getSandbox: async () => fakeSandbox() };
    await expect(run(publishArtifact)({ slug: "plan", title: "Plan" }, ctx)).resolves.toEqual({
      error: "InvalidArtifactError",
      message: "Write the page to artifacts/plan/index.html first, then publish it",
    });
  });

  it("refuses a bad slug before touching the sandbox", async () => {
    const ctx = {
      getSandbox: async () => {
        throw new Error("sandbox opened");
      },
    };
    await expect(run(publishArtifact)({ slug: "../x", title: "X" }, ctx)).resolves.toMatchObject({
      error: "InvalidPathError",
    });
  });

  it("maps an unsafe page to an error result", async () => {
    const sandbox = fakeSandbox({
      "artifacts/plan/index.html": '<script src="https://cdn.example/x.js"></script>',
    });
    const result = await run(publishArtifact)(
      { slug: "plan", title: "Plan" },
      { getSandbox: async () => sandbox },
    );
    expect(result).toMatchObject({ error: "InvalidArtifactError" });
    expect(store.commits).toHaveLength(0);
  });

  it("needs no approval (ADR-0011)", () => {
    expect(publishArtifact.approval).toBeUndefined();
  });
});

describe("open_artifact and list_artifacts", () => {
  it("copies a published artifact's source into the sandbox", async () => {
    const sandbox = fakeSandbox({ "artifacts/plan/index.html": page("v1") });
    const ctx = { getSandbox: async () => sandbox };
    await run(publishArtifact)({ slug: "plan", title: "Plan", project: "acme" }, ctx);
    delete sandbox.files["artifacts/plan/index.html"];

    await expect(run(openArtifact)({ path: "out/acme/plan.html" }, ctx)).resolves.toEqual({
      opened: true,
      path: "out/acme/plan.html",
      slug: "plan",
      project: "acme",
      title: "Plan",
      version: 1,
      file: "artifacts/plan/index.html",
    });
    expect(sandbox.files["artifacts/plan/index.html"]).toBe(page("v1"));
    await expect(run(listArtifacts)({})).resolves.toEqual({ artifacts: ["out/acme/plan.html"] });
  });

  it("reports a missing artifact", async () => {
    const ctx = { getSandbox: async () => fakeSandbox() };
    await expect(run(openArtifact)({ path: "out/nope.html" }, ctx)).resolves.toMatchObject({
      error: "ArtifactNotFoundError",
    });
  });
});
