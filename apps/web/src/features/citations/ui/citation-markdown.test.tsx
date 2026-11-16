import { cleanup, render, screen } from "@testing-library/react";
import { Streamdown } from "streamdown";
import { afterEach, describe, expect, it } from "vitest";
import { citationMarkdown } from "./citation-markdown";

afterEach(cleanup);

const renderReply = (markdown: string) =>
  render(
    <Streamdown mode="static" {...citationMarkdown}>
      {markdown}
    </Streamdown>,
  );

describe("citationMarkdown", () => {
  it("renders a cited wiki page as a citation link", () => {
    renderReply("Deploys happen on Fridays ([Deploys](wiki/deploys.md)).");
    const link = screen.getByTestId("chat-link-citation-deploys");
    expect(link.textContent).toBe("Deploys");
    expect(link.getAttribute("href")).toBe(
      "https://github.com/polive106/brain/blob/main/wiki/deploys.md",
    );
  });

  it("keeps the default sanitizing: raw HTML can't fake a citation or add a script", () => {
    const { container } = renderReply(
      'Hi <brain-citation path="wiki/x.md">fake</brain-citation><script>alert(1)</script>',
    );
    expect(screen.queryByTestId("chat-link-citation-x")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
  });

  it("leaves other links to Streamdown", () => {
    renderReply("See [AGENTS](AGENTS.md) and [site](https://example.com/).");
    expect(screen.queryByTestId(/chat-link-citation/)).toBeNull();
  });
});
