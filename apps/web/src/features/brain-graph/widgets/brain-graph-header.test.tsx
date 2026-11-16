import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BrainGraphHeader, type BrainGraphHeaderProps } from "./brain-graph-header";

afterEach(cleanup);

function show(overrides: Partial<BrainGraphHeaderProps> = {}) {
  const props: BrainGraphHeaderProps = {
    status: "ready",
    error: undefined,
    pages: 12,
    links: 30,
    graphRef: "0123456789abcdef0123456789abcdef01234567",
    query: "",
    matches: 0,
    onQuery: vi.fn(),
    onSubmit: vi.fn(),
    ...overrides,
  };
  render(<BrainGraphHeader {...props} />);
  return props;
}

describe("BrainGraphHeader", () => {
  it("links back to the chat and shows the counts and the short commit", () => {
    show();
    expect(screen.getByTestId("brain-link-chat").getAttribute("href")).toBe("/");
    expect(screen.getByTestId("brain-text-count").textContent).toBe("12 pages · 30 links");
    expect(screen.getByTestId("brain-text-status").textContent).toBe("live0123456");
  });

  it("uses singulars, and shows a ref that isn't a commit sha whole", () => {
    show({ pages: 1, links: 1, graphRef: "memory-3" });
    expect(screen.getByTestId("brain-text-count").textContent).toBe("1 page · 1 link");
    expect(screen.getByTestId("brain-text-status").textContent).toBe("livememory-3");
  });

  it("says when it's loading or offline", () => {
    show({ status: "loading", graphRef: undefined });
    expect(screen.getByTestId("brain-text-status").textContent).toBe("loading");
    cleanup();
    show({ status: "error", error: "Couldn't reach the brain" });
    const status = screen.getByTestId("brain-text-status");
    expect(status.textContent).toContain("offline");
    expect(status.getAttribute("title")).toBe("Couldn't reach the brain");
  });

  it("searches as you type and focuses the best match on Enter", () => {
    const props = show({ query: "churn", matches: 2 });
    expect(screen.getByTestId("brain-text-matches").textContent).toBe("2");
    const input = screen.getByTestId("brain-input-search");
    fireEvent.change(input, { target: { value: "churn a" } });
    expect(props.onQuery).toHaveBeenCalledWith("churn a");
    fireEvent.submit(input);
    expect(props.onSubmit).toHaveBeenCalled();
  });

  it("hides the match count without a query", () => {
    show();
    expect(screen.queryByTestId("brain-text-matches")).toBeNull();
  });
});
