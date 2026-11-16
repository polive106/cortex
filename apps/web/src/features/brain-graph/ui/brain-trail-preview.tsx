"use client";

import type { EveMessage } from "eve/react";
import type { SidePanelState } from "@/lib/side-panel";
import type { TrailStep } from "../api";
import { useBrainGraph } from "../hooks/use-brain-graph";
import { useBrainTrail } from "../hooks/use-brain-trail";
import { useFollowAgent } from "../hooks/use-follow-agent";
import { useGraphStage } from "../hooks/use-graph-stage";
import { BrainFollowButton } from "../widgets/brain-follow-button";
import { BrainGraphCanvas } from "../widgets/brain-graph-canvas";
import { BrainOpenButton } from "../widgets/brain-open-button";
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
  readonly pollMs?: number;
}

const EMPTY = [] as const;

/**
 * The brain panel beside the chat: the graph with the agent's path through it, live (E7-US02).
 * Nothing until the agent uses the brain; then it opens by itself. Hidden, it stays mounted (the
 * graph and its layout survive) but stops polling. During a turn it follows the agent (E7-US03).
 */
export function BrainTrailPreview({
  messages,
  agent,
  artifact = "none",
  busy = false,
  pollMs,
}: BrainTrailPreviewProps) {
  const { steps, written, open, show, hide } = useBrainTrail(messages);
  if (steps.length === 0) return null;
  const shown = open && artifact !== "open";
  return (
    <>
      {shown ? null : <BrainOpenButton onOpen={show} shifted={artifact === "closed"} />}
      <BrainTrailPanel hidden={!shown} onClose={hide} steps={steps.length}>
        <TrailGraph
          agent={agent}
          busy={busy}
          paused={!shown}
          pollMs={pollMs}
          steps={steps}
          written={written}
        />
      </BrainTrailPanel>
    </>
  );
}

/** The live graph inside the panel. */
function TrailGraph({
  agent,
  busy,
  paused,
  pollMs,
  steps,
  written,
}: {
  readonly agent: string;
  readonly busy: boolean;
  readonly paused: boolean;
  readonly pollMs: number | undefined;
  readonly steps: readonly TrailStep[];
  readonly written: string | undefined;
}) {
  const { graph, fresh } = useBrainGraph(agent, { pollMs, target: written, paused });
  const nodes = graph?.nodes ?? EMPTY;
  const edges = graph?.edges ?? EMPTY;
  const { canvas, viewport } = useGraphStage(nodes, edges);
  const { following, toggle } = useFollowAgent({
    busy,
    latest: steps.at(-1),
    positions: canvas.positions,
    viewport,
  });
  return (
    <div className="absolute inset-0" data-following={following} data-testid="chat-graph-brain">
      <BrainGraphCanvas {...canvas} edges={edges} fresh={fresh} nodes={nodes} quiet trail={steps} />
      <BrainFollowButton following={following} onToggle={toggle} />
    </div>
  );
}
