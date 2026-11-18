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
      "https://github.com/polive106/brain/blob/main/wiki/team/on-call.md",
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
});
