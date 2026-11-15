import { describe, expect, it } from "vitest";
import { Changeset } from "../../wiki/entities/changeset";
import { InvalidPathError } from "../../wiki/errors";
import { FakeWikiStore } from "../../wiki/testing/fake-wiki-store";
import { ArtifactNotFoundError } from "../errors";
import { ListArtifacts } from "./list-artifacts";
import { ReadArtifact } from "./read-artifact";

const v = (n: number) =>
  `<html><head>\n<!-- cortex:artifact -->\n<meta name="cortex:version" content="${n}">\n<!-- /cortex:artifact --><title>Plan</title></head><body>v${n}</body></html>`;

async function setup() {
  const store = new FakeWikiStore({ "wiki/a.md": "page" });
  const first = await store.commit(new Changeset().write("out/plan.html", v(1)), "v1");
  await store.commit(new Changeset().write("out/plan.html", v(2)), "v2");
  return { store, first: first.ref, read: new ReadArtifact(store) };
}

describe("ReadArtifact", () => {
  it("reads the latest version with its page and editable source", async () => {
    const { read } = await setup();
    const { artifact, html } = await read.execute("out/plan.html");
    expect(artifact).toMatchObject({ version: 2, title: "Plan" });
    expect(artifact.source).not.toContain("cortex:artifact");
    expect(html).toBe(v(2));
  });

  it("reads an earlier version by its commit", async () => {
    const { read, first } = await setup();
    await expect(read.execute("out/plan.html", first)).resolves.toMatchObject({
      artifact: { version: 1 },
      html: v(1),
    });
  });

  it("throws for a missing artifact or an unknown commit", async () => {
    const { read } = await setup();
    await expect(read.execute("out/missing.html")).rejects.toThrow(ArtifactNotFoundError);
    await expect(read.execute("out/plan.html", "nope")).rejects.toThrow(
      "No artifact at out/plan.html (nope)",
    );
  });

  it("refuses a path outside out/", async () => {
    const { read } = await setup();
    await expect(read.execute("wiki/a.md")).rejects.toThrow(InvalidPathError);
  });
});

describe("ListArtifacts", () => {
  it("lists every artifact", async () => {
    const { store } = await setup();
    await expect(new ListArtifacts(store).execute()).resolves.toEqual(["out/plan.html"]);
  });
});
