"use client";

import { brainFileUrl } from "@/lib/brain-location";
import type { TrailStep } from "../api";
import { useBrainGraph } from "../hooks/use-brain-graph";
import { useForceLayout } from "../hooks/use-force-layout";
import { useGraphFocus } from "../hooks/use-graph-focus";
import { useGraphViewport } from "../hooks/use-graph-viewport";
import { BrainGraphCanvas } from "../widgets/brain-graph-canvas";
import { BrainGraphHeader } from "../widgets/brain-graph-header";

export interface BrainGraphViewProps {
  /** The agent whose `/brain/graph` route serves the graph. */
  readonly agent: string;
  /** The agent's path through the brain to highlight (E7-US02). */
  readonly trail?: readonly TrailStep[];
  /** How often to look for new commits, in ms. */
  readonly pollMs?: number;
}

const EMPTY = [] as const;
const NO_TRAIL: readonly TrailStep[] = [];

/** The brain as a live, explorable graph (E7-US01). */
export function BrainGraphView({ agent, trail = NO_TRAIL, pollMs }: BrainGraphViewProps) {
  const { status, graph, fresh, error } = useBrainGraph(agent, pollMs);
  const nodes = graph?.nodes ?? EMPTY;
  const edges = graph?.edges ?? EMPTY;
  const layout = useForceLayout(nodes, edges);
  const viewport = useGraphViewport(layout);
  const focus = useGraphFocus(nodes, edges);

  const open = (id: string) => {
    if (viewport.isClick()) window.open(brainFileUrl(id), "_blank", "noopener,noreferrer");
  };
  const focusBestMatch = () => {
    const point = focus.matches[0] && layout.positions.get(focus.matches[0]);
    if (point) viewport.centreOn(point);
  };

  return (
    <main
      className="relative h-dvh w-full overflow-hidden bg-[#1b1b1b]"
      data-testid="brain-panel-graph"
    >
      <BrainGraphHeader
        error={error}
        graphRef={graph?.ref}
        links={edges.length}
        matches={focus.matches.length}
        onQuery={focus.setQuery}
        onSubmit={focusBestMatch}
        pages={nodes.filter((node) => node.kind === "page").length}
        query={focus.query}
        status={status}
      />
      {status === "error" && !graph ? (
        <p
          className="absolute inset-0 flex items-center justify-center text-red-300 text-sm"
          data-testid="brain-text-error"
        >
          {error}
        </p>
      ) : null}
      <BrainGraphCanvas
        dragging={viewport.dragging}
        edges={edges}
        fresh={fresh}
        highlighted={focus.highlighted}
        hovered={focus.hovered}
        nodes={nodes}
        onHover={focus.setHovered}
        onOpen={open}
        onPointerDown={viewport.onPointerDown}
        onPointerMove={viewport.onPointerMove}
        onPointerUp={viewport.onPointerUp}
        onWheel={viewport.onWheel}
        positions={layout.positions}
        size={viewport.size}
        svgRef={viewport.svgRef}
        trail={trail}
        transform={viewport.transform}
      />
    </main>
  );
}
