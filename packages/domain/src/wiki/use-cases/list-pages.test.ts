import { describe, expect, it } from "vitest";
import { FakeWikiStore } from "../testing/fake-wiki-store";
import { ListPages } from "./list-pages";

describe("ListPages", () => {
  it("lists page paths, nothing outside wiki/", async () => {
    const store = new FakeWikiStore({ "wiki/b.md": "", "wiki/a.md": "", "index.md": "" });
    await expect(new ListPages(store).execute()).resolves.toEqual(["wiki/a.md", "wiki/b.md"]);
  });
});
