import {
  type PointerEvent,
  type RefCallback,
  useCallback,
  useEffect,
  useRef,
  useState,
  type WheelEvent,
} from "react";
import type { ForceLayout, Point } from "./use-force-layout";

/** Pan (x, y in screen pixels from the centre) and zoom (k). */
export interface Transform {
  readonly x: number;
  readonly y: number;
  readonly k: number;
}

export interface GraphViewport {
  /** Attach to the <svg>: the viewport measures it. */
  readonly svgRef: RefCallback<SVGSVGElement>;
  readonly size: Size;
  readonly transform: Transform;
  /** The node being dragged. */
  readonly dragging: string | undefined;
  readonly onWheel: (event: WheelEvent<SVGSVGElement>) => void;
  readonly onPointerDown: (event: PointerEvent<SVGSVGElement>) => void;
  readonly onPointerMove: (event: PointerEvent<SVGSVGElement>) => void;
  readonly onPointerUp: (event: PointerEvent<SVGSVGElement>) => void;
  /** False for the click that ends a drag, so dragging a node doesn't open it. */
  readonly isClick: () => boolean;
  /** Centres the view on a point of the graph. */
  readonly centreOn: (point: Point) => void;
  /** Eases the view to centre a point at zoom `k` (following the agent). */
  readonly glideTo: (point: Point, k: number) => void;
  /** Eases back to the whole graph, then keeps it framed as it grows. */
  readonly fit: () => void;
  /** The person has panned, zoomed or dragged since the last `resetUserMoved`. */
  readonly userMoved: boolean;
  readonly resetUserMoved: () => void;
}

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 4;
const FIT_PADDING = 80;
/** Pointer travel (px) past which a press on a node is a drag, not a click. */
const DRAG_SLOP = 4;

const GLIDE_MS = 450;

const clamp = (k: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, k));
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

type Size = { readonly width: number; readonly height: number };

/** The transform that frames every node, zoomed in no further than 1. */
function fitTransform(positions: ReadonlyMap<string, Point>, size: Size): Transform | undefined {
  if (positions.size === 0 || size.width === 0 || size.height === 0) return undefined;
  let [minX, maxX, minY, maxY] = [
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ];
  for (const { x, y } of positions.values()) {
    [minX, maxX, minY, maxY] = [
      Math.min(minX, x),
      Math.max(maxX, x),
      Math.min(minY, y),
      Math.max(maxY, y),
    ];
  }
  const k = clamp(
    Math.min(
      1,
      size.width / (maxX - minX + FIT_PADDING * 2),
      size.height / (maxY - minY + FIT_PADDING * 2),
    ),
  );
  return { x: (-(minX + maxX) / 2) * k, y: (-(minY + maxY) / 2) * k, k };
}

type Gesture =
  | { kind: "pan"; from: Point; start: Transform }
  | { kind: "node"; id: string; from: Point; moved: boolean }
  | { kind: "pinch"; distance: number; start: Transform };

/**
 * Pan, zoom (wheel or pinch) and node dragging for the graph. Until the view is moved (by the
 * person, or a glide or centre), it keeps the whole graph in frame, so a live update that grows
 * the graph stays visible.
 */
export function useGraphViewport(layout: ForceLayout): GraphViewport {
  const { positions, pin, release } = layout;
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, k: 1 });
  const [dragging, setDragging] = useState<string>();
  const element = useRef<SVGSVGElement | null>(null);
  const observer = useRef<ResizeObserver | undefined>(undefined);
  const current = useRef(transform);
  current.current = transform;
  // Off while anything has moved the view: then the graph is no longer kept in frame.
  const autoFit = useRef(true);
  const [userMoved, setUserMoved] = useState(false);
  const movedByHand = useRef(false);
  const frame = useRef<number | undefined>(undefined);
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<Gesture | undefined>(undefined);
  const lastDragMoved = useRef(false);

  const svgRef = useCallback((svg: SVGSVGElement | null) => {
    observer.current?.disconnect();
    element.current = svg;
    if (!svg) return;
    const measure = () => {
      const { width, height } = svg.getBoundingClientRect();
      setSize((was) => (was.width === width && was.height === height ? was : { width, height }));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    observer.current = new ResizeObserver(measure);
    observer.current.observe(svg);
  }, []);

  const positionsNow = useRef(positions);
  positionsNow.current = positions;
  const sizeNow = useRef(size);
  sizeNow.current = size;

  const stopGlide = useCallback(() => {
    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    frame.current = undefined;
  }, []);
  useEffect(() => stopGlide, [stopGlide]);

  /** Eases from the current transform to `to`, then runs `done`. */
  const animate = useCallback(
    (to: Transform, done?: () => void) => {
      stopGlide();
      const from = current.current;
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / GLIDE_MS);
        const e = ease(t);
        setTransform({
          x: from.x + (to.x - from.x) * e,
          y: from.y + (to.y - from.y) * e,
          k: from.k + (to.k - from.k) * e,
        });
        if (t < 1) {
          frame.current = requestAnimationFrame(step);
        } else {
          frame.current = undefined;
          done?.();
        }
      };
      frame.current = requestAnimationFrame(step);
    },
    [stopGlide],
  );

  /** Something other than auto-fit drives the view now: stop any glide and stop framing. */
  const takeOver = useCallback(() => {
    stopGlide();
    autoFit.current = false;
  }, [stopGlide]);

  /** The person moved the view: take over, and say so (once, not on every pointer event). */
  const moveByHand = useCallback(() => {
    takeOver();
    if (movedByHand.current) return;
    movedByHand.current = true;
    setUserMoved(true);
  }, [takeOver]);

  useEffect(() => {
    if (!autoFit.current || frame.current !== undefined) return;
    const fitted = fitTransform(positions, size);
    if (fitted) setTransform(fitted);
  }, [positions, size]);

  const glideTo = useCallback(
    (point: Point, k: number) => {
      takeOver();
      const zoom = clamp(k);
      animate({ x: -point.x * zoom, y: -point.y * zoom, k: zoom });
    },
    [animate, takeOver],
  );

  const fit = useCallback(() => {
    const fitted = fitTransform(positionsNow.current, sizeNow.current);
    const resume = () => {
      autoFit.current = true;
    };
    if (fitted) animate(fitted, resume);
    else resume();
  }, [animate]);

  const resetUserMoved = useCallback(() => {
    movedByHand.current = false;
    setUserMoved(false);
  }, []);

  /** A pointer's offset from the svg's centre, in screen pixels. */
  const offset = (clientX: number, clientY: number): Point => {
    const rect = element.current?.getBoundingClientRect();
    return {
      x: clientX - (rect?.left ?? 0) - (rect?.width ?? 0) / 2,
      y: clientY - (rect?.top ?? 0) - (rect?.height ?? 0) / 2,
    };
  };
  const toGraph = (screen: Point, t: Transform): Point => ({
    x: (screen.x - t.x) / t.k,
    y: (screen.y - t.y) / t.k,
  });

  const zoomAround = useCallback(
    (screen: Point, k: number, from: Transform) => {
      moveByHand();
      const point = toGraph(screen, from);
      const next = clamp(k);
      setTransform({ x: screen.x - point.x * next, y: screen.y - point.y * next, k: next });
    },
    [moveByHand],
  );

  const onWheel = useCallback(
    (event: WheelEvent<SVGSVGElement>) => {
      const t = current.current;
      zoomAround(offset(event.clientX, event.clientY), t.k * Math.exp(-event.deltaY * 0.0015), t);
    },
    [zoomAround],
  );

  const pinchDistance = () => {
    const [a, b] = [...pointers.current.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };

  const onPointerDown = useCallback((event: PointerEvent<SVGSVGElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const screen = offset(event.clientX, event.clientY);
    pointers.current.set(event.pointerId, screen);
    if (pointers.current.size === 2) {
      gesture.current = { kind: "pinch", distance: pinchDistance(), start: current.current };
      return;
    }
    const id = (event.target as Element).closest?.("[data-node-id]")?.getAttribute("data-node-id");
    gesture.current = id
      ? { kind: "node", id, from: screen, moved: false }
      : { kind: "pan", from: screen, start: current.current };
    if (id) setDragging(id);
  }, []);

  const onPointerMove = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      if (!pointers.current.has(event.pointerId)) return;
      const screen = offset(event.clientX, event.clientY);
      pointers.current.set(event.pointerId, screen);
      const active = gesture.current;
      if (active?.kind === "pinch") {
        const [a, b] = [...pointers.current.values()] as [Point, Point];
        const middle = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        zoomAround(middle, active.start.k * (pinchDistance() / active.distance), active.start);
      } else if (active?.kind === "pan") {
        moveByHand();
        setTransform({
          ...active.start,
          x: active.start.x + screen.x - active.from.x,
          y: active.start.y + screen.y - active.from.y,
        });
      } else if (active?.kind === "node") {
        const travel = Math.hypot(screen.x - active.from.x, screen.y - active.from.y);
        if (!active.moved && travel < DRAG_SLOP) return;
        if (!active.moved) moveByHand();
        active.moved = true;
        pin(active.id, toGraph(screen, current.current));
      }
    },
    [pin, zoomAround, moveByHand],
  );

  const onPointerUp = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      pointers.current.delete(event.pointerId);
      const active = gesture.current;
      if (active?.kind === "node") {
        release(active.id);
        lastDragMoved.current = active.moved;
        setDragging(undefined);
      }
      gesture.current = undefined;
    },
    [release],
  );

  const isClick = useCallback(() => {
    const moved = lastDragMoved.current;
    lastDragMoved.current = false;
    return !moved;
  }, []);

  const centreOn = useCallback(
    (point: Point) => {
      takeOver();
      const { k } = current.current;
      setTransform({ x: -point.x * k, y: -point.y * k, k });
    },
    [takeOver],
  );

  return {
    svgRef,
    size,
    transform,
    dragging,
    onWheel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    isClick,
    centreOn,
    glideTo,
    fit,
    userMoved,
    resetUserMoved,
  };
}
