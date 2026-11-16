import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { GraphNode } from "../api";
import { useGraphFocus } from "./use-graph-focus";

afterEach(cleanup);

const node = (id: string, title: string): GraphNode => ({
  id,
  title,
  summary: "",
  kind: "page",
  degree: 1,
});
const nodes = [
  node("wiki/user-research.md", "User research"),
  node("wiki/churn.md", "Why users churn"),
  node("wiki/pricing.md", "Pricing"),
];
const edges = [{ source: "wiki/churn.md", target: "wiki/pricing.md" }];

describe("useGraphFocus", () => {
  it("focuses nothing at first", () => {
    const { result } = renderHook(() => useGraphFocus(nodes, edges));
    expect(result.current.highlighted).toBeUndefined();
    expect(result.current.matches).toEqual([]);
  });

  it("matches the query, title prefixes first, then titles and paths containing it", () => {
    const { result } = renderHook(() => useGraphFocus(nodes, edges));
    act(() => result.current.setQuery(" Us "));
    expect(result.current.matches).toEqual(["wiki/user-research.md", "wiki/churn.md"]);
    expect([...(result.current.highlighted ?? [])]).toEqual(result.current.matches);
    act(() => result.current.setQuery("pricing.md"));
    expect(result.current.matches).toEqual(["wiki/pricing.md"]);
  });

  it("highlights a hovered node and its neighbours over the search", () => {
    const { result } = renderHook(() => useGraphFocus(nodes, edges));
    act(() => {
      result.current.setQuery("user");
      result.current.setHovered("wiki/churn.md");
    });
    expect([...(result.current.highlighted ?? [])]).toEqual(["wiki/churn.md", "wiki/pricing.md"]);
    act(() => result.current.setHovered("wiki/user-research.md"));
    expect([...(result.current.highlighted ?? [])]).toEqual(["wiki/user-research.md"]);
  });
});
