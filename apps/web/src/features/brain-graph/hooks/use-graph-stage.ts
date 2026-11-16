import { useCallback, useMemo } from "react";
import { brainFileUrl } from "@/lib/brain-location";
import type { GraphEdge, GraphNode } from "../api";
import type { BrainGraphCanvasProps } from "../widgets/brain-graph-canvas";
import { useForceLayout } from "./use-force-layout";
import { type GraphFocus, useGraphFocus } from "./use-graph-focus";
import { type GraphViewport, useGraphViewport } from "./use-graph-viewport";

/** What the canvas needs from the stage; the view adds the graph data and the trail. */
export type StageCanvasProps = Omit<
  BrainGraphCanvasProps,
  "nodes" | "edges" | "fresh" | "trail" | "quiet"
>;

export interface GraphStage {
  readonly canvas: StageCanvasProps;
  readonly focus: GraphFocus;
  /** Centres the view on the search's best match. */
  readonly focusBestMatch: () => void;
  /** Moves the view for the person (following the agent). */
  readonly viewport: GraphViewport;
}

/**
 * Layout, pan and zoom, and hover or search focus for one drawing of the graph, wired together
 * for the canvas. The full `/brain` view and the chat's brain panel both use it.
 */
export function useGraphStage(
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[],
): GraphStage {
  const layout = useForceLayout(nodes, edges);
  const viewport = useGraphViewport(layout);
  const focus = useGraphFocus(nodes, edges);

  const { isClick, centreOn } = viewport;
  const onOpen = useCallback(
    (id: string) => {
      if (isClick()) window.open(brainFileUrl(id), "_blank", "noopener,noreferrer");
    },
    [isClick],
  );
  const { positions } = layout;
  const focusBestMatch = useCallback(() => {
    const point = focus.matches[0] && positions.get(focus.matches[0]);
    if (point) centreOn(point);
  }, [centreOn, focus.matches, positions]);
  // One object per real change, so the memoised canvas skips renders that change nothing.
  const canvas = useMemo<StageCanvasProps>(
    () => ({
      positions,
      size: viewport.size,
      transform: viewport.transform,
      svgRef: viewport.svgRef,
      dragging: viewport.dragging,
      highlighted: focus.highlighted,
      hovered: focus.hovered,
      onHover: focus.setHovered,
      onOpen,
      onWheel: viewport.onWheel,
      onPointerDown: viewport.onPointerDown,
      onPointerMove: viewport.onPointerMove,
      onPointerUp: viewport.onPointerUp,
    }),
    [
      positions,
      viewport.size,
      viewport.transform,
      viewport.svgRef,
      viewport.dragging,
      viewport.onWheel,
      viewport.onPointerDown,
      viewport.onPointerMove,
      viewport.onPointerUp,
      focus.highlighted,
      focus.hovered,
      focus.setHovered,
      onOpen,
    ],
  );

  return { canvas, focus, focusBestMatch, viewport };
}
