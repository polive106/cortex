import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BrainPage } from "../api";
import { BrainReader, type BrainReaderProps } from "./brain-reader";

afterEach(cleanup);

const page = (body: string, path = "wiki/team/on-call.md"): BrainPage => ({
  ref: "r1",
  path,
  title: "On-call",
  summary: "Who answers",
  updated: "2026-11-10",
  body,
});

const renderReader = (props: Partial<BrainReaderProps> = {}) => {
  const onOpenPage = vi.fn();
  const onBack = vi.fn();
  const { container } = render(
    <BrainReader
      canGoBack={false}
      onBack={onBack}
      onOpenPage={onOpenPage}
      page={undefined}
      path={undefined}
      scope="chat"
      status="idle"
      {...props}
    />,
  );
  return { onOpenPage, onBack, container };
};

describe("BrainReader", () => {
  it("asks for a page until there is one", () => {
    renderReader();
    expect(screen.getByTestId("chat-text-reader-title").textContent).toBe("Reader");
    expect(screen.getByTestId("chat-text-reader-empty").textContent).toMatch(/Click a page/);
    expect(screen.queryByTestId("chat-link-reader-github")).toBeNull();
  });

  it("names the page while it loads, and says when it's missing or failed", () => {
    renderReader({ path: "wiki/deploys.md", status: "loading" });
    expect(screen.getByTestId("chat-text-reader-title").textContent).toBe("deploys");
    expect(screen.getByTestId("chat-text-reader-empty").textContent).toBe("Loading…");
    cleanup();
    renderReader({ path: "wiki/deploys.md", status: "missing" });
    expect(screen.getByTestId("chat-text-reader-empty").textContent).toMatch(/isn't in the brain/);
    cleanup();
    renderReader({ path: "wiki/deploys.md", status: "error", page: page("old") });
    expect(screen.getByTestId("chat-text-reader-empty").textContent).toMatch(/Couldn't load/);
  });

  it("renders the page with its title, date and GitHub link", () => {
    renderReader({
      path: "wiki/team/on-call.md",
      status: "ready",
      page: page("# Rota\n\nPage the **lead**."),
    });
    expect(screen.getByTestId("chat-text-reader-title").textContent).toBe("On-call");
    expect(screen.getByText(/updated 2026-11-10/)).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Rota" })).toBeTruthy();
    expect(screen.getByText("lead").getAttribute("data-streamdown")).toBe("strong");
    expect(screen.getByTestId("chat-link-reader-github").getAttribute("href")).toBe(
      "https://github.com/polive106/brain/blob/main/wiki/team/on-call.md",
    );
  });

  it("opens linked pages in the reader and leaves other links alone", () => {
    const { onOpenPage } = renderReader({
      path: "wiki/team/on-call.md",
      status: "ready",
      page: page(
        "See [deploys](../deploys.md), the [index](/index.md), [raw](../../raw/x.md) and [site](https://example.com/).",
      ),
    });
    fireEvent.click(screen.getByTestId("chat-btn-reader-page-deploys"));
    expect(onOpenPage).toHaveBeenCalledWith("wiki/deploys.md");
    fireEvent.click(screen.getByTestId("chat-btn-reader-page-index"));
    expect(onOpenPage).toHaveBeenLastCalledWith("index.md");
    expect(screen.queryByTestId(/chat-btn-reader-page-raw/)).toBeNull();
    expect(screen.getByText("site")).toBeTruthy();
  });

  it("keeps sanitizing: raw HTML can't fake a page link, run a script or load a remote image", () => {
    const { container } = renderReader({
      path: "wiki/team/on-call.md",
      status: "ready",
      page: page(
        'Hi <brain-page-link path="wiki/x.md">fake</brain-page-link><script>alert(1)</script> ![p](https://evil.example/p.png)',
      ),
    });
    expect(screen.queryByTestId("chat-btn-reader-page-x")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector('img[src^="https://evil.example"]')).toBeNull();
  });

  it("goes back and closes when asked", () => {
    const onClose = vi.fn();
    const { onBack } = renderReader({ scope: "brain", canGoBack: true, onClose });
    fireEvent.click(screen.getByTestId("brain-btn-reader-back"));
    fireEvent.click(screen.getByTestId("brain-btn-reader-close"));
    expect(onBack).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
