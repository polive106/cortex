import { useCallback, useEffect, useRef, useState } from "react";
import type { TrailStep } from "../api";
import type { Point } from "./use-force-layout";
import type { GraphViewport } from "./use-graph-viewport";

/** How close the view gets to the page the agent is on. */
export const FOLLOW_ZOOM = 1.15;
/** How long after a turn ends the view eases back out to the whole brain. */
export const SETTLE_MS = 1_200;

/** What following needs from the viewport. */
export type FollowViewport = Pick<
  GraphViewport,
  "glideTo" | "fit" | "userMoved" | "resetUserMoved"
>;

export interface FollowOptions {
  /** A turn is running. */
  readonly busy: boolean;
  readonly latest: TrailStep | undefined;
  readonly positions: ReadonlyMap<string, Point>;
  readonly viewport: FollowViewport;
}

export interface FollowState {
  /** The view is following the agent right now. */
  readonly following: boolean;
  /** Stops following, or starts again (going back to the latest step). */
  readonly toggle: () => void;
}

/**
 * Follows the agent through the brain (E7-US03): each new step glides the view to its page, and
 * once the turn ends the view eases back out to the whole brain. Moving the view by hand pauses
 * following until the next turn; the toggle turns it off, or back on.
 */
export function useFollowAgent({ busy, latest, positions, viewport }: FollowOptions): FollowState {
  const { glideTo, fit, userMoved, resetUserMoved } = viewport;
  const [enabled, setEnabled] = useState(true);
  const following = enabled && !userMoved;
  // The step the view last went to. Steps from before the panel opened, outside a turn, are old.
  const followed = useRef<string | undefined>(busy ? undefined : latest?.id);
  // After a turn has eased out, a page placed late (a slow reload) mustn't pull the view back in.
  const settled = useRef(false);

  useEffect(() => {
    if (!following || !latest || followed.current === latest.id) return;
    // A page the agent just wrote has no place until the graph reloads: wait for it.
    const point = positions.get(latest.path);
    if (!point) return;
    followed.current = latest.id;
    if (!busy && settled.current) return;
    glideTo(point, FOLLOW_ZOOM);
  }, [following, latest, positions, glideTo, busy]);

  const toggle = useCallback(() => {
    if (following) {
      setEnabled(false);
      return;
    }
    // Back on: go to the latest step again, wherever the turn is.
    followed.current = undefined;
    settled.current = false;
    setEnabled(true);
    resetUserMoved();
  }, [following, resetUserMoved]);

  const wasBusy = useRef(busy);
  const followingNow = useRef(following);
  followingNow.current = following;
  useEffect(() => {
    const ended = wasBusy.current && !busy;
    wasBusy.current = busy;
    if (busy) settled.current = false;
    if (!ended) return;
    const timer = setTimeout(() => {
      settled.current = true;
      if (followingNow.current) fit();
      // Whatever the person did during the turn, the next one is followed again.
      resetUserMoved();
    }, SETTLE_MS);
    return () => clearTimeout(timer);
  }, [busy, fit, resetUserMoved]);

  return { following, toggle };
}
