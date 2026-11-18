"use client";

import { useBrainGraph } from "../hooks/use-brain-graph";
import { useBrainPage } from "../hooks/use-brain-page";
import { useGraphStage } from "../hooks/use-graph-stage";
import { useReaderSelection } from "../hooks/use-reader-selection";
import { BrainGraphCanvas } from "../widgets/brain-graph-canvas";
import { BrainGraphHeader } from "../widgets/brain-graph-header";
import { BrainReader } from "../widgets/brain-reader";

export interface BrainGraphViewProps {
  /** The agent whose `/brain/graph` route serves the graph. */
  readonly agent: string;
  /** How often to look for new commits, in ms. */
  readonly pollMs?: number;
}

const EMPTY = [] as const;

/**
 * The brain as a live, explorable graph (E7-US01). Clicking a page opens it in a reader pane over
 * the graph's right side, or its lower half on phones (E7-US04).
 */
export function BrainGraphView({ agent, pollMs }: BrainGraphViewProps) {
  const { status, graph, fresh, error } = useBrainGraph(agent, { pollMs });
  const nodes = graph?.nodes ?? EMPTY;
  const edges = graph?.edges ?? EMPTY;
  const reader = useReaderSelection();
  const page = useBrainPage(agent, reader.path, graph?.ref);
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
      <BrainGraphCanvas
        {...canvas}
        edges={edges}
        fresh={fresh}
        nodes={nodes}
        onOpen={reader.open}
      />
      {reader.path ? (
        <div className="absolute inset-x-0 bottom-0 z-10 h-[55%] border-t shadow-2xl [--border:oklch(1_0_0/10%)] lg:top-14 lg:bottom-0 lg:right-0 lg:left-auto lg:h-auto lg:w-[40%] lg:max-w-[680px] lg:border-t-0 lg:border-l">
          <BrainReader
            canGoBack={reader.canGoBack}
            onBack={reader.back}
            onClose={reader.close}
            onOpenPage={reader.open}
            page={page.page}
            path={reader.path}
            scope="brain"
            status={page.status}
          />
        </div>
      ) : null}
    </main>
  );
}
