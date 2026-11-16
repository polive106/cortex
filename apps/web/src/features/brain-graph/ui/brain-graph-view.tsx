"use client";

import { useBrainGraph } from "../hooks/use-brain-graph";
import { useGraphStage } from "../hooks/use-graph-stage";
import { BrainGraphCanvas } from "../widgets/brain-graph-canvas";
import { BrainGraphHeader } from "../widgets/brain-graph-header";

export interface BrainGraphViewProps {
  /** The agent whose `/brain/graph` route serves the graph. */
  readonly agent: string;
  /** How often to look for new commits, in ms. */
  readonly pollMs?: number;
}

const EMPTY = [] as const;

/** The brain as a live, explorable graph (E7-US01). */
export function BrainGraphView({ agent, pollMs }: BrainGraphViewProps) {
  const { status, graph, fresh, error } = useBrainGraph(agent, { pollMs });
  const nodes = graph?.nodes ?? EMPTY;
  const edges = graph?.edges ?? EMPTY;
  const { canvas, focus, focusBestMatch } = useGraphStage(nodes, edges);

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
      <BrainGraphCanvas {...canvas} edges={edges} fresh={fresh} nodes={nodes} />
    </main>
  );
}
