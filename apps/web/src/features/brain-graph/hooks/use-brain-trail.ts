import type { EveMessage } from "eve/react";
import { useMemo, useRef, useState } from "react";
import { type BrainTrail, brainTrail } from "../api";

export interface BrainTrailState extends BrainTrail {
  readonly open: boolean;
  readonly show: () => void;
  readonly hide: () => void;
}

const signature = ({ steps, written }: BrainTrail) =>
  `${written}|${steps.map((s) => `${s.id}:${s.action}:${s.active}`).join(",")}`;

/**
 * The agent's path through the brain in this conversation, and whether the brain panel shows it
 * (E7-US02). The panel opens by itself once the agent uses the brain, until the person closes or
 * opens it. The trail keeps its identity while tokens stream, so the graph only re-renders when
 * the agent actually moves.
 */
export function useBrainTrail(messages: readonly EveMessage[]): BrainTrailState {
  const last = useRef<{ key: string; trail: BrainTrail } | undefined>(undefined);
  const trail = useMemo(() => {
    const next = brainTrail(messages);
    const key = signature(next);
    if (last.current?.key !== key) last.current = { key, trail: next };
    return last.current.trail;
  }, [messages]);
  // Undefined until the person chooses: then the panel simply follows the agent's first step.
  const [choice, setChoice] = useState<boolean>();

  return {
    ...trail,
    open: choice ?? trail.steps.length > 0,
    show: () => setChoice(true),
    hide: () => setChoice(false),
  };
}
