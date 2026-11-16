import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
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
});
