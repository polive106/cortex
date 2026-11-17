import { useCallback, useRef, useState } from "react";
import type { PageRequest } from "@/lib/brain-reader-context";

export interface ReaderSelectionOptions {
  /** The page the agent last read or wrote, which the reader follows. */
  readonly target?: string;
  /** The view follows the agent: a new step takes over from a page the person opened. */
  readonly following?: boolean;
  /** A page someone asked for from outside the panel (a citation). */
  readonly request?: PageRequest;
}

export interface ReaderSelection {
  /** The page the reader shows, if any. */
  readonly path: string | undefined;
  readonly canGoBack: boolean;
  /** Shows a page the person picked (a node, a link in the reader). Stable. */
  readonly open: (path: string) => void;
  /** Returns to the page shown before the last one the person opened. Stable. */
  readonly back: () => void;
  /** Lets go of the person's pages: the reader shows the agent's latest again, if any. Stable. */
  readonly close: () => void;
}

interface Picks {
  /** The page the person opened, over the agent's. */
  readonly picked: string | undefined;
  /** The pages shown before, most recent last. */
  readonly history: readonly string[];
}

const NONE: Picks = { picked: undefined, history: [] };

/**
 * Which page the reader shows (E7-US04): the one the person opened, else the agent's latest.
 * While following is on, the agent's next step takes over again, as the view does (E7-US03).
 * The actions are stable, so the memoised graph doesn't redraw when the page changes.
 */
export function useReaderSelection({
  target,
  following = false,
  request,
}: ReaderSelectionOptions = {}): ReaderSelection {
  const [picks, setPicks] = useState<Picks>(NONE);
  const [seenTarget, setSeenTarget] = useState(target);
  const [seenRequest, setSeenRequest] = useState<PageRequest>();
  const latestTarget = useRef(target);
  latestTarget.current = target;

  const open = useCallback((next: string) => {
    setPicks(({ picked, history }) => {
      const shown = picked ?? latestTarget.current;
      if (next === shown) return { picked, history };
      return { picked: next, history: shown === undefined ? history : [...history, shown] };
    });
  }, []);
  const back = useCallback(() => {
    setPicks((current) =>
      current.history.length === 0
        ? current
        : { picked: current.history.at(-1), history: current.history.slice(0, -1) },
    );
  }, []);
  const close = useCallback(() => setPicks(NONE), []);

  // Adjusting state while rendering, not in an effect, skips a frame of the old page.
  if (target !== seenTarget) {
    setSeenTarget(target);
    if (following) setPicks(NONE);
  }
  if (request !== seenRequest) {
    setSeenRequest(request);
    if (request) open(request.path);
  }

  return {
    path: picks.picked ?? target,
    canGoBack: picks.history.length > 0,
    open,
    back,
    close,
  };
}
