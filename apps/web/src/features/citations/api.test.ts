import { describe, expect, it } from "vitest";
import {
  CITATION_TAG,
  citationPath,
  citationSlug,
  citationUrl,
  type HastNode,
  rehypeCitations,
} from "./api";

describe("citationPath", () => {
  it.each(["wiki/deploys.md", "wiki/team/on-call-rota.md", "wiki/a1.md"])("accepts %s", (href) => {
    expect(citationPath(href)).toBe(href);
  });

  it.each([
    "wiki/../AGENTS.md",
    "wiki/Deploys.md",
    "wiki/deploys",
    "raw/2026-11-16-x.md",
    "/wiki/deploys.md",
    "https://github.com/polive106/brain/blob/main/wiki/deploys.md",
    "wiki/deploys.md?x=1",
    "wiki//deploys.md",
  ])("refuses %s", (href) => {
    expect(citationPath(href)).toBeUndefined();
  });
});

describe("citation links", () => {
  it("point at the page in the brain repo on GitHub, polive106/brain on main by default", () => {
    expect(citationUrl("wiki/team/on-call.md")).toBe(
      "https://github.com/polive106/brain/blob/main/wiki/team/on-call.md",
    );
  });

  it("have a slug for their test id", () => {
    expect(citationSlug("wiki/deploys.md")).toBe("deploys");
    expect(citationSlug("wiki/team/on-call.md")).toBe("team-on-call");
  });
});

describe("rehypeCitations", () => {
  const link = (href: unknown, text = "Deploys"): HastNode => ({
    type: "element",
    tagName: "a",
    properties: { href },
    children: [{ type: "text", value: text }],
  });

  it("turns links to wiki pages into citation elements, anywhere in the tree", () => {
    const tree: HastNode = {
      type: "root",
      children: [
        { type: "element", tagName: "p", properties: {}, children: [link("wiki/deploys.md")] },
      ],
    };
    rehypeCitations()(tree);
    expect(tree.children?.[0]?.children?.[0]).toEqual({
      type: "element",
      tagName: CITATION_TAG,
      properties: { path: "wiki/deploys.md" },
      children: [{ type: "text", value: "Deploys" }],
    });
  });

  it("leaves every other link and element alone", () => {
    const other = link("https://example.com/");
    const outside = link("AGENTS.md");
    const missing = link(undefined);
    const tree: HastNode = {
      type: "root",
      children: [other, outside, missing, { type: "text", value: "x" }],
    };
    rehypeCitations()(tree);
    expect(tree.children).toEqual([
      link("https://example.com/"),
      link("AGENTS.md"),
      link(undefined),
      { type: "text", value: "x" },
    ]);
  });
});
