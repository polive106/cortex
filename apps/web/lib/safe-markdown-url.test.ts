import type { UrlTransform } from "streamdown";
import { describe, expect, it } from "vitest";
import { safeMarkdownUrl } from "./safe-markdown-url";

type Element = Parameters<UrlTransform>[2];

const node = (tagName: string) =>
  ({ type: "element", tagName, properties: {}, children: [] }) as Element;

describe("safeMarkdownUrl", () => {
  it("drops remote image sources, so a reply cannot send data to another host", () => {
    expect(safeMarkdownUrl("https://evil.example/p.png?secret=1", "src", node("img"))).toBeNull();
    expect(safeMarkdownUrl("//evil.example/p.png", "src", node("img"))).toBeNull();
  });

  it("drops paths that browsers normalize into another host", () => {
    for (const url of ["/\\evil.example/x", "/\t/evil.example/x", "/\n/evil.example/x", "/ /x"]) {
      expect(safeMarkdownUrl(url, "src", node("img"))).toBeNull();
      expect(safeMarkdownUrl(url, "href", node("a"))).toBeNull();
    }
  });

  it("keeps same-origin relative image sources", () => {
    expect(safeMarkdownUrl("/icon.svg", "src", node("img"))).toBe("/icon.svg");
  });

  it("keeps https and mailto links", () => {
    expect(safeMarkdownUrl("https://example.com/a", "href", node("a"))).toBe(
      "https://example.com/a",
    );
    expect(safeMarkdownUrl("mailto:a@example.com", "href", node("a"))).toBe("mailto:a@example.com");
  });

  it("drops dangerous or unknown link protocols", () => {
    expect(safeMarkdownUrl("javascript:alert(1)", "href", node("a"))).toBeNull();
    expect(safeMarkdownUrl("data:text/html,<script>", "href", node("a"))).toBeNull();
    expect(safeMarkdownUrl("relative/page", "href", node("a"))).toBeNull();
  });

  it("keeps same-page anchors", () => {
    expect(safeMarkdownUrl("#section", "href", node("a"))).toBe("#section");
  });
});
