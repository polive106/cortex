import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GraphNode, TrailStep } from "../api";
import { BrainGraphCanvas, type BrainGraphCanvasProps } from "./brain-graph-canvas";

afterEach(cleanup);

const node = (id: string, degree: number, kind: GraphNode["kind"] = "page"): GraphNode => ({
  id,
  title: id === "index.md" ? "Index" : `Title of ${id}`,
  summary: id === "index.md" ? "3 articles" : "",
  kind,
  degree,
});

function show(overrides: Partial<BrainGraphCanvasProps> = {}) {
  const props: BrainGraphCanvasProps = {
    nodes: [node("index.md", 2, "index"), node("wiki/a.md", 2), node("wiki/people/b.md", 1)],
    edges: [
      { source: "index.md", target: "wiki/a.md" },
      { source: "wiki/a.md", target: "wiki/people/b.md" },
      { source: "wiki/a.md", target: "wiki/unplaced.md" },
    ],
    positions: new Map([
      ["index.md", { x: 0, y: 0 }],
      ["wiki/a.md", { x: 100, y: 0 }],
      ["wiki/people/b.md", { x: 150, y: 80 }],
    ]),
    size: { width: 800, height: 600 },
    transform: { x: 10, y: 20, k: 1 },
    svgRef: vi.fn(),
    highlighted: undefined,
    hovered: undefined,
    dragging: undefined,
    fresh: new Set(),
    trail: [],
    onHover: vi.fn(),
    onOpen: vi.fn(),
    onWheel: vi.fn(),
    onPointerDown: vi.fn(),
    onPointerMove: vi.fn(),
    onPointerUp: vi.fn(),
    ...overrides,
  };
  const view = render(<BrainGraphCanvas {...props} />);
  return { ...view, props };
}

/** The graph's edges, not the trail's hops. */
const lines = (container: HTMLElement) => [
  ...container.querySelectorAll("svg > g > g:first-child > line"),
];
const step = (path: string, action: TrailStep["action"] = "read", active = false) => ({
  id: `call:${path}`,
  path,
  action,
  active,
});

describe("BrainGraphCanvas", () => {
  it("draws the hub, each placed page labelled by file name, and edges between placed nodes", () => {
    const { container } = show();
    expect(screen.getByTestId("brain-node-index").textContent).toContain("INDEX");
    expect(screen.getByTestId("brain-text-articles").textContent).toBe("3 articles");
    expect(screen.getByTestId("brain-node-people-b").textContent).toContain("b");
    expect(screen.getByTestId("brain-node-a").getAttribute("transform")).toBe("translate(100 0)");
    expect(lines(container)).toHaveLength(2);
    expect(container.querySelector("svg > g")?.getAttribute("transform")).toBe(
      "translate(410 320) scale(1)",
    );
  });

  it("skips nodes it has no position for", () => {
    show({ positions: new Map([["index.md", { x: 0, y: 0 }]]) });
    expect(screen.queryByTestId("brain-node-a")).toBeNull();
  });

  it("dims what isn't highlighted and lights the hovered node's edges", () => {
    const { container } = show({
      highlighted: new Set(["wiki/a.md", "wiki/people/b.md"]),
      hovered: "wiki/a.md",
    });
    expect(screen.getByTestId("brain-node-index").getAttribute("opacity")).toBe("0.18");
    expect(screen.getByTestId("brain-node-a").getAttribute("opacity")).toBe("1");
    const [toHub, toB] = lines(container);
    expect(toHub?.getAttribute("stroke-opacity")).toBe("0.12");
    expect(toB?.getAttribute("stroke")).toBe("#c8c8c8");
  });

  it("draws a hop per step in the step's colour, and pulses the latest page", () => {
    show({
      trail: [step("index.md", "search"), step("wiki/a.md"), step("wiki/people/b.md", "write")],
    });
    const hops = screen.getAllByTestId("brain-line-hop");
    expect(hops).toHaveLength(2);
    expect(hops[0]?.querySelector("line")?.getAttribute("stroke")).toBe("#f0b45a");
    expect(hops[1]?.querySelector("line")?.getAttribute("stroke")).toBe("#7ee0a1");
    expect(hops[1]?.getAttribute("opacity")).toBe("1");
    expect(Number(hops[0]?.getAttribute("opacity"))).toBeLessThan(1);
    expect(hops[1]?.querySelector("animate")).toBeTruthy();
    const ring = screen.getByTestId("brain-ring-latest");
    expect(ring.closest("[data-node-id]")?.getAttribute("data-node-id")).toBe("wiki/people/b.md");
    expect(ring.getAttribute("stroke")).toBe("#7ee0a1");
    expect(ring.getAttribute("class")).not.toContain("animation-duration");
    const a = screen.getByTestId("brain-node-a").querySelectorAll("circle");
    expect(a[a.length - 1]?.getAttribute("stroke")).toBe("#f0b45a");
  });

  it("pulses faster while the latest call runs, and skips hops to unplaced pages", () => {
    show({ trail: [step("wiki/gone.md"), step("wiki/a.md", "read", true)] });
    expect(screen.queryAllByTestId("brain-line-hop")).toHaveLength(0);
    expect(screen.getByTestId("brain-ring-latest").getAttribute("class")).toContain(
      "animation-duration",
    );
  });

  it("draws only the latest hops", () => {
    const trail = Array.from({ length: 12 }, (_, i) =>
      step(i % 2 ? "wiki/a.md" : "index.md", "read"),
    ).map((s, i) => ({ ...s, id: `c${i}` }));
    show({ trail });
    expect(screen.getAllByTestId("brain-line-hop")).toHaveLength(8);
  });

  it("dims untouched pages when quiet, and only with a trail", () => {
    show({ quiet: true, trail: [step("wiki/a.md")] });
    expect(screen.getByTestId("brain-node-a").getAttribute("opacity")).toBe("1");
    expect(screen.getByTestId("brain-node-people-b").getAttribute("opacity")).toBe("0.45");
    cleanup();
    show({ quiet: true });
    expect(screen.getByTestId("brain-node-people-b").getAttribute("opacity")).toBe("1");
  });

  it("fades new nodes in", () => {
    show({ fresh: new Set(["wiki/a.md"]) });
    expect(screen.getByTestId("brain-node-a").querySelector(".animate-in")).toBeTruthy();
    expect(screen.getByTestId("brain-node-index").querySelector(".animate-in")).toBeNull();
  });

  it("enlarges labels when zoomed out", () => {
    show({ transform: { x: 0, y: 0, k: 0.25 } });
    const label = screen.getByTestId("brain-node-a").querySelector("text");
    expect(Number(label?.getAttribute("font-size"))).toBeCloseTo(23.4);
  });

  it("reports hover, open (click or Enter), and pointer gestures", () => {
    const { props, container } = show({ dragging: "wiki/a.md" });
    const a = screen.getByTestId("brain-node-a");
    fireEvent.pointerEnter(a);
    expect(props.onHover).toHaveBeenCalledWith("wiki/a.md");
    fireEvent.pointerLeave(a);
    expect(props.onHover).toHaveBeenLastCalledWith(undefined);
    fireEvent.click(a);
    fireEvent.keyDown(a, { key: "Enter" });
    fireEvent.keyDown(a, { key: "x" });
    expect(props.onOpen).toHaveBeenCalledTimes(2);
    const svg = container.querySelector("svg") as SVGSVGElement;
    expect(svg.getAttribute("class")).toContain("cursor-grabbing");
    fireEvent.wheel(svg);
    fireEvent.pointerDown(svg);
    fireEvent.pointerMove(svg);
    fireEvent.pointerUp(svg);
    expect(props.onWheel).toHaveBeenCalled();
    expect(props.onPointerDown).toHaveBeenCalled();
    expect(props.onPointerMove).toHaveBeenCalled();
    expect(props.onPointerUp).toHaveBeenCalled();
  });
});
