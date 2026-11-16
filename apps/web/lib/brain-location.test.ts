import { describe, expect, it } from "vitest";
import { brainFileUrl, brainLocation, pageName, pageSlug } from "./brain-location";

describe("brainFileUrl", () => {
  it("points at the file in the brain repo on GitHub, polive106/brain on main by default", () => {
    expect(brainFileUrl("wiki/team/on-call.md")).toBe(
      "https://github.com/polive106/brain/blob/main/wiki/team/on-call.md",
    );
  });

  it("follows the configured brain repo and branch", () => {
    const brain = brainLocation("acme/wiki", "release/1 rc");
    expect(brainFileUrl("wiki/a.md", brain)).toBe(
      "https://github.com/acme/wiki/blob/release/1%20rc/wiki/a.md",
    );
  });

  it("ignores a malformed repo setting", () => {
    expect(brainLocation("not a repo", "")).toEqual({ repo: "polive106/brain", branch: "main" });
    expect(brainLocation("a/b/c")).toMatchObject({ repo: "polive106/brain" });
  });
});

describe("page names", () => {
  it("slug a page path for test ids, and name it by its file", () => {
    expect(pageSlug("wiki/team/on-call.md")).toBe("team-on-call");
    expect(pageName("wiki/team/on-call.md")).toBe("on-call");
  });
});
