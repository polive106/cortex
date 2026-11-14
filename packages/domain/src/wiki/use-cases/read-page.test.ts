import { describe, expect, it } from "vitest";
import { InvalidPathError, PageNotFoundError } from "../errors";
import { FakeWikiStore } from "../testing/fake-wiki-store";
import { ReadPage } from "./read-page";

describe("ReadPage", () => {
  const store = new FakeWikiStore({ "wiki/a.md": "---\ntitle: A\n---\nbody", "AGENTS.md": "x" });

  it("returns the parsed page", async () => {
    const page = await new ReadPage(store).execute("wiki/a.md");
    expect(page).toMatchObject({ title: "A", body: "body" });
  });

  it("throws PageNotFoundError for a missing page", async () => {
    await expect(new ReadPage(store).execute("wiki/b.md")).rejects.toThrow(PageNotFoundError);
  });

  it("refuses paths outside wiki/ before touching the store", async () => {
    await expect(new ReadPage(store).execute("AGENTS.md")).rejects.toThrow(InvalidPathError);
  });
});
