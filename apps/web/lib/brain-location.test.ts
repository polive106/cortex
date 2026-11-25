import { describe, expect, it } from "vitest";
import { brainFileUrl, brainLocation, pageName, pageSlug } from "./brain-location";

describe("brainFileUrl", () => {
  it("points at the file in the configured brain repo on GitHub, main by default", () => {
    expect(brainFileUrl("wiki/team/on-call.md", brainLocation("acme/brain"))).toBe(
      "https://github.com/acme/brain/blob/main/wiki/team/on-call.md",
    );
  });

  it("follows the configured branch", () => {
    const brain = brainLocation("acme/wiki", "release/1 rc");
    expect(brainFileUrl("wiki/a.md", brain)).toBe(
      "https://github.com/acme/wiki/blob/release/1%20rc/wiki/a.md",
    );
  });

  it("has no link without a brain repo, or with a malformed one", () => {
    expect(brainLocation("", "")).toBeUndefined();
    expect(brainLocation("not a repo")).toBeUndefined();
    expect(brainLocation("a/b/c")).toBeUndefined();
    expect(brainFileUrl("wiki/a.md", undefined)).toBeUndefined();
  });
});

describe("page names", () => {
  it("slug a page path for test ids, and name it by its file", () => {
    expect(pageSlug("wiki/team/on-call.md")).toBe("team-on-call");
    expect(pageName("wiki/team/on-call.md")).toBe("on-call");
  });
});
