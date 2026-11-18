import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PageRequest } from "@/lib/brain-reader-context";
import { type ReaderSelectionOptions, useReaderSelection } from "./use-reader-selection";

const setup = (initialProps: ReaderSelectionOptions = {}) =>
  renderHook((props: ReaderSelectionOptions) => useReaderSelection(props), { initialProps });

describe("useReaderSelection", () => {
  it("shows nothing until there's a page, then the agent's latest", () => {
    const { result, rerender } = setup();
    expect(result.current.path).toBeUndefined();
    expect(result.current.canGoBack).toBe(false);
    rerender({ target: "wiki/a.md", following: true });
    expect(result.current.path).toBe("wiki/a.md");
  });

  it("shows the page the person opens, and goes back", () => {
    const { result } = setup({ target: "wiki/a.md" });
    act(() => result.current.open("wiki/b.md"));
    act(() => result.current.open("wiki/b.md"));
    act(() => result.current.open("wiki/c.md"));
    expect(result.current.path).toBe("wiki/c.md");
    act(() => result.current.back());
    expect(result.current.path).toBe("wiki/b.md");
    act(() => result.current.back());
    expect(result.current).toMatchObject({ path: "wiki/a.md", canGoBack: false });
    act(() => result.current.back());
    expect(result.current.path).toBe("wiki/a.md");
  });

  it("lets the agent take over while following, and not otherwise", () => {
    const { result, rerender } = setup({ target: "wiki/a.md", following: false });
    act(() => result.current.open("wiki/b.md"));
    rerender({ target: "wiki/c.md", following: false });
    expect(result.current.path).toBe("wiki/b.md");
    rerender({ target: "wiki/d.md", following: true });
    expect(result.current).toMatchObject({ path: "wiki/d.md", canGoBack: false });
  });

  it("opens each request, even for the same page again", () => {
    const first: PageRequest = { path: "wiki/x.md", id: 1 };
    const { result, rerender } = setup({ target: "wiki/a.md", request: first });
    expect(result.current.path).toBe("wiki/x.md");
    act(() => result.current.open("wiki/y.md"));
    rerender({ target: "wiki/a.md", request: first });
    expect(result.current.path).toBe("wiki/y.md");
    rerender({ target: "wiki/a.md", request: { path: "wiki/x.md", id: 2 } });
    expect(result.current.path).toBe("wiki/x.md");
    expect(result.current.canGoBack).toBe(true);
  });

  it("closes back to the agent's page", () => {
    const { result } = setup({ target: "wiki/a.md" });
    act(() => result.current.open("wiki/b.md"));
    act(() => result.current.close());
    expect(result.current).toMatchObject({ path: "wiki/a.md", canGoBack: false });
  });
});
