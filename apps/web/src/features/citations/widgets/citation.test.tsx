import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Citation } from "./citation";

afterEach(cleanup);

describe("Citation", () => {
  it("links the page on GitHub in a new tab", () => {
    render(<Citation path="wiki/team/on-call.md">On-call</Citation>);
    const link = screen.getByTestId("chat-link-citation-team-on-call");
    expect(link.textContent).toBe("On-call");
    expect(link.getAttribute("href")).toBe(
      "https://github.com/acme/brain/blob/main/wiki/team/on-call.md",
    );
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noreferrer");
    expect(link.getAttribute("title")).toBe("wiki/team/on-call.md");
  });

  it("opens the page in the brain reader on a plain click, and on GitHub otherwise", () => {
    const onOpen = vi.fn();
    render(
      <Citation onOpen={onOpen} path="wiki/deploys.md">
        Deploys
      </Citation>,
    );
    const link = screen.getByTestId("chat-link-citation-deploys");
    expect(fireEvent.click(link)).toBe(false);
    expect(onOpen).toHaveBeenCalledWith("wiki/deploys.md");
    expect(fireEvent.click(link, { metaKey: true })).toBe(true);
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it("has no GitHub link without a brain repo, but still opens the reader", async () => {
    vi.resetModules();
    vi.stubEnv("BRAIN_REPO", "");
    const { Citation: Unlinked } = await import("./citation");
    vi.unstubAllEnvs();
    const onOpen = vi.fn();
    render(
      <Unlinked onOpen={onOpen} path="wiki/deploys.md">
        Deploys
      </Unlinked>,
    );
    const citation = screen.getByTestId("chat-link-citation-deploys");
    expect(citation.hasAttribute("href")).toBe(false);
    fireEvent.click(citation);
    expect(onOpen).toHaveBeenCalledWith("wiki/deploys.md");
  });
});
