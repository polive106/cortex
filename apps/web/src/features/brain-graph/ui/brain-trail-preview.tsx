"use client";

import type { EveMessage } from "eve/react";
import type { PageRequest } from "@/lib/brain-reader-context";
import type { SidePanelState } from "@/lib/side-panel";
import { readerTarget, type TrailStep } from "../api";
import { useBrainGraph } from "../hooks/use-brain-graph";
import { useBrainPage } from "../hooks/use-brain-page";
import { useBrainTrail } from "../hooks/use-brain-trail";
import { useFollowAgent } from "../hooks/use-follow-agent";
import { useGraphStage } from "../hooks/use-graph-stage";
import { useReaderSelection } from "../hooks/use-reader-selection";
import { BrainFollowButton } from "../widgets/brain-follow-button";
import { BrainGraphCanvas } from "../widgets/brain-graph-canvas";
import { BrainOpenButton } from "../widgets/brain-open-button";
import { BrainReader } from "../widgets/brain-reader";
import { BrainTrailPanel } from "../widgets/brain-trail-panel";

export interface BrainTrailPreviewProps {
  /** The conversation, as `useEveAgent` gives it. */
  readonly messages: readonly EveMessage[];
  /** The agent whose `/brain/graph` route serves the graph. */
  readonly agent: string;
  /** The artifact preview: while it's open the brain panel waits behind its button. */
  readonly artifact?: SidePanelState;
  /** A turn is running: the panel follows the agent, then eases out when it ends. */
  readonly busy?: boolean;
  /** A page to read, asked for from the chat (a citation): the panel opens on it (E7-US04). */
  readonly page?: PageRequest;
  readonly pollMs?: number;
}

const EMPTY = [] as const;

/**
 * The brain panel beside the chat: the graph with the agent's path through it, live (E7-US02),
 * and the page reader under it (E7-US04). Nothing until the agent uses the brain or someone asks
 * for a page; then it opens by itself. Hidden, it stays mounted (the graph and its layout survive)
 * but stops polling. During a turn it follows the agent (E7-US03).
 */
export function BrainTrailPreview({
  messages,
  agent,
  artifact = "none",
  busy = false,
  page,
  pollMs,
}: BrainTrailPreviewProps) {
  const { steps, written, open, show, hide } = useBrainTrail(messages, page);
  if (steps.length === 0 && page === undefined) return null;
  const shown = open && artifact !== "open";
  return (
    <>
      {shown ? null : <BrainOpenButton onOpen={show} shifted={artifact === "closed"} />}
      <BrainTrailPanel hidden={!shown} onClose={hide} steps={steps.length}>
        <TrailStage
          agent={agent}
          busy={busy}
          paused={!shown}
          pollMs={pollMs}
          request={page}
          steps={steps}
          written={written}
        />
      </BrainTrailPanel>
    </>
  );
}

/** The live graph on top, the reader below. */
function TrailStage({
  agent,
  busy,
  paused,
  pollMs,
  request,
  steps,
  written,
}: {
  readonly agent: string;
  readonly busy: boolean;
  readonly paused: boolean;
  readonly pollMs: number | undefined;
  readonly request: PageRequest | undefined;
  readonly steps: readonly TrailStep[];
  readonly written: string | undefined;
}) {
  const { graph, fresh } = useBrainGraph(agent, { pollMs, target: written, paused });
  const nodes = graph?.nodes ?? EMPTY;
  const edges = graph?.edges ?? EMPTY;
  const { canvas, viewport } = useGraphStage(nodes, edges);
  const follow = useFollowAgent({
    busy,
    latest: steps.at(-1),
    positions: canvas.positions,
    viewport,
  });
  const selection = useReaderSelection({
    target: readerTarget(steps),
    following: follow.following,
    request,
  });
  const page = useBrainPage(agent, selection.path, graph?.ref);
  return (
    <div className="absolute inset-0 flex flex-col">
      <div
        className="relative h-[45%] shrink-0"
        data-following={follow.following}
        data-testid="chat-graph-brain"
      >
        <BrainGraphCanvas
          {...canvas}
          edges={edges}
          fresh={fresh}
          nodes={nodes}
          onOpen={selection.open}
          quiet
          trail={steps}
        />
        <BrainFollowButton following={follow.following} onToggle={follow.toggle} />
      </div>
      <div className="min-h-0 flex-1 border-t [--border:oklch(1_0_0/10%)]">
        <BrainReader
          canGoBack={selection.canGoBack}
          onBack={selection.back}
          onOpenPage={selection.open}
          page={page.page}
          path={selection.path}
          scope="chat"
          status={page.status}
        />
      </div>
    </div>
  );
}
