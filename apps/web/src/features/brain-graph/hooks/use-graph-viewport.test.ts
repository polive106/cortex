import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { PointerEvent, WheelEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ForceLayout, Point } from "./use-force-layout";
import { useGraphViewport } from "./use-graph-viewport";

afterEach(cleanup);

/** An svg of 800×600 at the page's origin, so its centre is (400, 300). */
function svg(): SVGSVGElement {
  const element = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  element.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600 }) as DOMRect;
  return element;
}

function nodeTarget(id: string): Element {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("data-node-id", id);
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  group.appendChild(circle);
  return circle;
}

const pointer = (clientX: number, clientY: number, target: Element, pointerId = 1) =>
  ({
    clientX,
    clientY,
    pointerId,
    target,
    currentTarget: { setPointerCapture: vi.fn() },
  }) as unknown as PointerEvent<SVGSVGElement>;

function setup(points: Record<string, Point> = { a: { x: -100, y: -50 }, b: { x: 100, y: 50 } }) {
  const layout: ForceLayout = {
    positions: new Map(Object.entries(points)),
    pin: vi.fn(),
    release: vi.fn(),
  };
  const view = renderHook(() => useGraphViewport(layout));
  const element = svg();
  act(() => view.result.current.svgRef(element));
  return { ...view, layout, element };
}

describe("useGraphViewport", () => {
  it("measures the svg and fits the graph in it, zoomed in no further than 1", () => {
    const { result } = setup();
    expect(result.current.size).toEqual({ width: 800, height: 600 });
    expect(result.current.transform).toEqual({ x: -0, y: -0, k: 1 });
  });

  it("zooms out to fit a large graph", () => {
    const { result } = setup({ a: { x: -1000, y: 0 }, b: { x: 1000, y: 100 } });
    expect(result.current.transform.k).toBeCloseTo(800 / 2160);
  });

  it("zooms with the wheel around the pointer, within limits", () => {
    const { result, element } = setup();
    act(() =>
      result.current.onWheel({
        clientX: 500,
        clientY: 300,
        deltaY: -200,
      } as WheelEvent<SVGSVGElement>),
    );
    const { k, x } = result.current.transform;
    expect(k).toBeGreaterThan(1);
    // The graph point under the pointer (100, 0) stays under it.
    expect(x + 100 * k).toBeCloseTo(100);
    act(() =>
      result.current.onWheel({ clientX: 0, clientY: 0, deltaY: 1e6 } as WheelEvent<SVGSVGElement>),
    );
    expect(result.current.transform.k).toBe(0.2);
    expect(element).toBeTruthy();
  });

  it("pans by dragging the background", () => {
    const { result, element } = setup();
    act(() => result.current.onPointerDown(pointer(400, 300, element)));
    act(() => result.current.onPointerMove(pointer(450, 280, element)));
    expect(result.current.transform).toMatchObject({ x: 50, y: -20 });
    act(() => result.current.onPointerUp(pointer(450, 280, element)));
    act(() => result.current.onPointerMove(pointer(500, 500, element)));
    expect(result.current.transform).toMatchObject({ x: 50, y: -20 });
  });

  it("drags a node", () => {
    const { result, layout } = setup();
    const target = nodeTarget("b");
    act(() => result.current.onPointerDown(pointer(500, 350, target)));
    expect(result.current.dragging).toBe("b");
    act(() => result.current.onPointerMove(pointer(501, 350, target)));
    expect(layout.pin).not.toHaveBeenCalled();
    act(() => result.current.onPointerMove(pointer(520, 360, target)));
    expect(layout.pin).toHaveBeenCalledWith("b", { x: 120, y: 60 });
    act(() => result.current.onPointerUp(pointer(520, 360, target)));
    expect(layout.release).toHaveBeenCalledWith("b");
    expect(result.current.dragging).toBeUndefined();
  });

  it("captures the pointer on a node only once it's dragged, so a plain click reaches the node", () => {
    const { result } = setup();
    const target = nodeTarget("b");
    const down = pointer(500, 350, target);
    act(() => result.current.onPointerDown(down));
    expect(down.currentTarget.setPointerCapture).not.toHaveBeenCalled();
    const move = pointer(520, 360, target);
    act(() => result.current.onPointerMove(move));
    expect(move.currentTarget.setPointerCapture).toHaveBeenCalledWith(1);
  });

  it("pinches to zoom", () => {
    const { result, element } = setup();
    act(() => result.current.onPointerDown(pointer(300, 300, element, 1)));
    act(() => result.current.onPointerDown(pointer(500, 300, element, 2)));
    act(() => result.current.onPointerMove(pointer(200, 300, element, 1)));
    expect(result.current.transform.k).toBeCloseTo(1.5);
  });

  it("centres on a point, and stops fitting once the user has moved the view", () => {
    const { result, rerender } = setup();
    act(() => result.current.centreOn({ x: 100, y: 50 }));
    expect(result.current.transform).toEqual({ x: -100, y: -50, k: 1 });
    rerender();
    expect(result.current.transform).toEqual({ x: -100, y: -50, k: 1 });
  });

  it("lets go of the svg", () => {
    const { result } = setup();
    act(() => result.current.svgRef(null));
    expect(result.current.size).toEqual({ width: 800, height: 600 });
  });

  it("eases to a point at a zoom, and a new glide replaces one in flight", async () => {
    const { result } = setup();
    act(() => result.current.glideTo({ x: 500, y: 500 }, 3));
    act(() => result.current.glideTo({ x: 100, y: 50 }, 2));
    await waitFor(() => expect(result.current.transform).toEqual({ x: -200, y: -100, k: 2 }));
    expect(result.current.userMoved).toBe(false);
  });

  it("frames the graph again, at once or smoothly, and keeps framing it", async () => {
    const layout = (points: Record<string, Point>): ForceLayout => ({
      positions: new Map(Object.entries(points)),
      pin: vi.fn(),
      release: vi.fn(),
    });
    const small = layout({ a: { x: -100, y: -50 }, b: { x: 100, y: 50 } });
    const { result, rerender } = renderHook(({ l }) => useGraphViewport(l), {
      initialProps: { l: small },
    });
    act(() => result.current.svgRef(svg()));
    act(() => result.current.centreOn({ x: 100, y: 50 }));
    act(() => result.current.fit());
    await waitFor(() => expect(result.current.transform.x).toBeCloseTo(0));
    expect(result.current.transform.k).toBe(1);
    rerender({ l: layout({ a: { x: -1000, y: 0 }, b: { x: 1000, y: 100 } }) });
    expect(result.current.transform.k).toBeCloseTo(800 / 2160);
    act(() => result.current.centreOn({ x: 0, y: 0 }));
    act(() => result.current.fit());
    await waitFor(() => expect(result.current.transform.k).toBeCloseTo(800 / 2160));
  });

  it("fits nothing before it's measured", () => {
    const layout: ForceLayout = { positions: new Map(), pin: vi.fn(), release: vi.fn() };
    const { result } = renderHook(() => useGraphViewport(layout));
    act(() => result.current.fit());
    expect(result.current.transform).toEqual({ x: 0, y: 0, k: 1 });
  });

  it("knows when the person moved the view, until reset; a pan stops a glide", async () => {
    const { result, element } = setup();
    act(() => result.current.glideTo({ x: 300, y: 300 }, 2));
    act(() => result.current.onPointerDown(pointer(400, 300, element)));
    act(() => result.current.onPointerMove(pointer(410, 300, element)));
    act(() => result.current.onPointerUp(pointer(410, 300, element)));
    expect(result.current.userMoved).toBe(true);
    const held = result.current.transform;
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(result.current.transform).toEqual(held);
    act(() => result.current.resetUserMoved());
    expect(result.current.userMoved).toBe(false);
  });
});
