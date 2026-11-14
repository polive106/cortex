import { describe, expect, it } from "vitest";
import { Page } from "./page";
import { PagePath } from "./page-path";

const path = PagePath.parse("wiki/deploys.md");

describe("Page", () => {
  it("round-trips frontmatter and body", () => {
    const page = new Page({
      path,
      title: "Deploys: how we ship",
      summary: "Trunk-based, deploy on push",
      sources: ["raw/2026-11-14-deploy-notes.md"],
      updated: "2026-11-14",
      body: "# Deploys\n\nWe push to main.\n",
    });
    const markdown = page.serialize();
    expect(markdown).toBe(
      [
        "---",
        "title: Deploys: how we ship",
        "summary: Trunk-based, deploy on push",
        "sources:",
        "  - raw/2026-11-14-deploy-notes.md",
        "updated: 2026-11-14",
        "---",
        "",
        "# Deploys",
        "",
        "We push to main.",
        "",
      ].join("\n"),
    );
    expect(Page.parse(path, markdown)).toEqual(page);
  });

  it("writes an empty source list inline and parses it back", () => {
    const page = new Page({
      path,
      title: "T",
      summary: "S",
      sources: [],
      updated: "2026-11-14",
      body: "x",
    });
    expect(page.serialize()).toContain("sources: []\n");
    expect(Page.parse(path, page.serialize()).sources).toEqual([]);
  });

  it("flattens newlines in single-line fields so frontmatter stays valid", () => {
    const page = new Page({
      path,
      title: "A\nB",
      summary: "C\r\nD",
      sources: [],
      updated: "2026-11-14",
      body: "",
    });
    expect(page.title).toBe("A B");
    expect(page.summary).toBe("C D");
  });

  it("treats a file without frontmatter as a body, titled from its slug", () => {
    const page = Page.parse(path, "Just text\n");
    expect(page).toMatchObject({
      title: "deploys",
      summary: "",
      sources: [],
      updated: "",
      body: "Just text\n",
    });
  });

  it("treats an unclosed frontmatter block as plain body", () => {
    expect(Page.parse(path, "---\ntitle: T\nno end").body).toBe("---\ntitle: T\nno end");
  });

  it("ignores list items that don't follow a list key", () => {
    expect(Page.parse(path, "---\ntitle: T\n  - stray\n---\nb").title).toBe("T");
  });

  it("ignores unknown frontmatter keys and tolerates missing ones", () => {
    const page = Page.parse(path, "---\ntitle: T\ntags: a\n---\nbody");
    expect(page).toMatchObject({ title: "T", summary: "", sources: [], updated: "", body: "body" });
  });
});
