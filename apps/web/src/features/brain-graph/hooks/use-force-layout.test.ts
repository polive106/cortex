import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { GraphEdge, GraphNode } from "../api";
import { useForceLayout } from "./use-force-layout";

afterEach(cleanup);

const node = (id: string, degree = 1, kind: GraphNode["kind"] = "page"): GraphNode => ({
  id,
  title: id,
  summary: "",
  kind,
  degree,
});

const hub = node("index.md", 2, "index");
const nodes = [hub, node("wiki/a.md", 2), node("wiki/b.md")];
const edges: GraphEdge[] = [
  { source: "index.md", target: "wiki/a.md" },
  { source: "wiki/a.md", target: "wiki/b.md" },
];

describe("useForceLayout", () => {
  it("lays every node out at once, with the hub at the origin", () => {
    const { result } = renderHook(() => useForceLayout(nodes, edges));
    const { positions } = result.current;
    expect([...positions.keys()]).toEqual(["index.md", "wiki/a.md", "wiki/b.md"]);
    expect(positions.get("index.md")).toEqual({ x: 0, y: 0 });
    for (const point of positions.values()) {
      expect(Number.isFinite(point.x) && Number.isFinite(point.y)).toBe(true);
    }
    const a = positions.get("wiki/a.md");
    expect(Math.hypot(a?.x ?? 0, a?.y ?? 0)).toBeGreaterThan(50);
  });

  it("keeps placed nodes and starts a new one next to its neighbour", async () => {
    const { result, rerender } = renderHook(({ n, e }) => useForceLayout(n, e), {
      initialProps: { n: nodes, e: edges },
    });
    const before = result.current.positions.get("wiki/b.md");
    rerender({
      n: [...nodes, node("wiki/c.md")],
      e: [...edges, { source: "wiki/b.md", target: "wiki/c.md" }],
    });
    await waitFor(() => expect(result.current.positions.has("wiki/c.md")).toBe(true));
    const b = result.current.positions.get("wiki/b.md");
    const c = result.current.positions.get("wiki/c.md");
    expect(Math.hypot((b?.x ?? 0) - (before?.x ?? 0), (b?.y ?? 0) - (before?.y ?? 0))).toBeLessThan(
      120,
    );
    expect(Math.hypot((c?.x ?? 0) - (b?.x ?? 0), (c?.y ?? 0) - (b?.y ?? 0))).toBeLessThan(300);
  });

  it("starts a new node with no placed neighbour near the centre", async () => {
    const { result, rerender } = renderHook(({ n }) => useForceLayout(n, edges), {
      initialProps: { n: nodes },
    });
    rerender({ n: [...nodes, node("wiki/lonely.md", 0)] });
    await waitFor(() => expect(result.current.positions.has("wiki/lonely.md")).toBe(true));
  });

  it("pins a dragged node where it's held, and lets it go; the hub never moves", async () => {
    const { result } = renderHook(() => useForceLayout(nodes, edges));
    act(() => result.current.pin("wiki/b.md", { x: 400, y: -300 }));
    await waitFor(() =>
      expect(result.current.positions.get("wiki/b.md")).toEqual({ x: 400, y: -300 }),
    );
    act(() => {
      result.current.pin("index.md", { x: 50, y: 50 });
      result.current.pin("wiki/missing.md", { x: 1, y: 1 });
      result.current.release("wiki/b.md");
      result.current.release("index.md");
      result.current.release("wiki/missing.md");
    });
    expect(result.current.positions.get("index.md")).toEqual({ x: 0, y: 0 });
  });

  it("is empty for an empty graph", () => {
    const none: GraphNode[] = [];
    const noEdges: GraphEdge[] = [];
    const { result } = renderHook(() => useForceLayout(none, noEdges));
    expect(result.current.positions.size).toBe(0);
  });
});
