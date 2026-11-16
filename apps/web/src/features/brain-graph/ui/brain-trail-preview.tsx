"use client";

import type { EveMessage } from "eve/react";
import type { SidePanelState } from "@/lib/side-panel";
import type { TrailStep } from "../api";
import { useBrainGraph } from "../hooks/use-brain-graph";
import { useBrainTrail } from "../hooks/use-brain-trail";
import { useGraphStage } from "../hooks/use-graph-stage";
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
  readonly pollMs?: number;
}

const EMPTY = [] as const;

/**
 * The brain panel beside the chat: the graph with the agent's path through it, live (E7-US02).
 * Nothing until the agent uses the brain; then it opens by itself. Hidden, it stays mounted (the
 * graph and its layout survive) but stops polling.
 */
export function BrainTrailPreview({
  messages,
  agent,
  artifact = "none",
  pollMs,
}: BrainTrailPreviewProps) {
  const { steps, written, open, show, hide } = useBrainTrail(messages);
  if (steps.length === 0) return null;
  const shown = open && artifact !== "open";
  return (
    <>
      {shown ? null : <BrainOpenButton onOpen={show} shifted={artifact === "closed"} />}
      <BrainTrailPanel hidden={!shown} onClose={hide} steps={steps.length}>
        <TrailGraph agent={agent} paused={!shown} pollMs={pollMs} steps={steps} written={written} />
      </BrainTrailPanel>
    </>
  );
}

/** The live graph inside the panel. */
function TrailGraph({
  agent,
  paused,
  pollMs,
  steps,
  written,
}: {
  readonly agent: string;
  readonly paused: boolean;
  readonly pollMs: number | undefined;
  readonly steps: readonly TrailStep[];
  readonly written: string | undefined;
}) {
  const { graph, fresh } = useBrainGraph(agent, { pollMs, target: written, paused });
  const nodes = graph?.nodes ?? EMPTY;
  const edges = graph?.edges ?? EMPTY;
  const { canvas } = useGraphStage(nodes, edges);
  return (
    <div className="absolute inset-0">
      <BrainGraphCanvas {...canvas} edges={edges} fresh={fresh} nodes={nodes} quiet trail={steps} />
    </div>
  );
}
