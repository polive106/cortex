import { describe, expect, it } from "vitest";
import { InvalidPathError } from "../errors";
import { isPagePath, PagePath } from "./page-path";

describe("PagePath", () => {
  it("accepts a markdown file under wiki/", () => {
    expect(PagePath.parse("wiki/deploy-process.md").value).toBe("wiki/deploy-process.md");
  });

  it("accepts nested folders", () => {
    expect(PagePath.parse("wiki/people/ada.md").value).toBe("wiki/people/ada.md");
  });

  it("derives a slug from the file name", () => {
    expect(PagePath.parse("wiki/people/ada-lovelace.md").slug).toBe("ada-lovelace");
  });

  it("builds a path from a title", () => {
    expect(PagePath.fromTitle("Deploy Process: v2!").value).toBe("wiki/deploy-process-v2.md");
  });

  it.each([
    ["outside wiki/", "raw/source.md"],
    ["not markdown", "wiki/page.txt"],
    ["parent traversal", "wiki/../AGENTS.md"],
    ["absolute path", "/wiki/page.md"],
    ["uppercase or spaces", "wiki/My Page.md"],
    ["empty segment", "wiki//page.md"],
    ["bare folder", "wiki/.md"],
  ])("rejects a path %s", (_reason, input) => {
    expect(() => PagePath.parse(input)).toThrow(InvalidPathError);
  });

  it("rejects a title with no usable characters", () => {
    expect(() => PagePath.fromTitle("!!!")).toThrow(InvalidPathError);
  });

  it("tells stored wiki pages from other files", () => {
    expect(isPagePath("wiki/a/b.md")).toBe(true);
    expect(isPagePath("wiki/a.txt")).toBe(false);
    expect(isPagePath("raw/a.md")).toBe(false);
  });

  it("compares by value", () => {
    expect(PagePath.parse("wiki/a.md").equals(PagePath.parse("wiki/a.md"))).toBe(true);
    expect(PagePath.parse("wiki/a.md").equals(PagePath.parse("wiki/b.md"))).toBe(false);
  });
});
