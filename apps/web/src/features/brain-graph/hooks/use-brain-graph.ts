import { useEffect, useRef, useState } from "react";
import { type BrainGraphData, brainGraphUrl, parseBrainGraph } from "../api";

export interface BrainGraphState {
  /** `error` keeps the last graph shown while polling retries. */
  readonly status: "loading" | "ready" | "error";
  readonly graph: BrainGraphData | undefined;
  /** Node ids that appeared after the first load, so they can fade in. */
  readonly fresh: ReadonlySet<string>;
  readonly error: string | undefined;
}

export interface BrainGraphOptions {
  /** How often to look for new commits, in ms. */
  readonly pollMs?: number;
  /** A commit the graph should catch up to (the agent just wrote it): load until it arrives. */
  readonly target?: string;
  /** Hold off loading (a hidden panel); the last graph stays. */
  readonly paused?: boolean;
}

export const POLL_MS = 5_000;
/** While catching up to a target commit: how often, and how many times at most. */
const CATCH_UP_MS = 500;
const CATCH_UP_TRIES = 12;

/**
 * The brain graph from the agent's `/brain/graph` route, kept live (E7-US01, ADR-0015). It polls
 * every `pollMs` while the tab is visible and on focus, sending the last ref as `If-None-Match`,
 * so an unchanged brain answers 304 and nothing re-renders.
 */
export function useBrainGraph(
  agent: string,
  { pollMs = POLL_MS, target, paused = false }: BrainGraphOptions = {},
): BrainGraphState {
  const [state, setState] = useState<BrainGraphState>({
    status: "loading",
    graph: undefined,
    fresh: new Set(),
    error: undefined,
  });
  const ref = useRef<string | undefined>(undefined);
  const reload = useRef<() => void>(() => {});
  const pausedNow = useRef(paused);
  pausedNow.current = paused;

  useEffect(() => {
    const controller = new AbortController();
    let inFlight = false;

    const fail = (error: string) => setState((current) => ({ ...current, status: "error", error }));

    const load = async () => {
      // A hidden tab or panel waits: focus, becoming visible, or unpausing loads straight away.
      if (inFlight || document.hidden || pausedNow.current) return;
      inFlight = true;
      try {
        const headers: HeadersInit = ref.current ? { "if-none-match": `"${ref.current}"` } : {};
        const response = await fetch(brainGraphUrl(agent), {
          credentials: "same-origin",
          headers,
          signal: controller.signal,
        });
        if (response.status === 304) {
          // Same state object when nothing changed, so an unchanged poll doesn't re-render.
          setState((current) =>
            current.status === "ready"
              ? current
              : { ...current, status: "ready", error: undefined },
          );
          return;
        }
        const graph = response.ok ? parseBrainGraph(await response.json()) : undefined;
        if (controller.signal.aborted) return;
        if (!graph) {
          fail(`Couldn't load the brain (${response.status})`);
          return;
        }
        ref.current = graph.ref;
        setState((current) => {
          const known = new Set(current.graph?.nodes.map((node) => node.id));
          const fresh = current.graph
            ? new Set(graph.nodes.map((node) => node.id).filter((id) => !known.has(id)))
            : new Set<string>();
          return { status: "ready", graph, fresh, error: undefined };
        });
      } catch {
        if (!controller.signal.aborted) fail("Couldn't reach the brain");
      } finally {
        inFlight = false;
      }
    };

    reload.current = () => void load();
    void load();
    const timer = setInterval(load, pollMs);
    window.addEventListener("focus", reload.current);
    document.addEventListener("visibilitychange", reload.current);
    return () => {
      controller.abort();
      clearInterval(timer);
      window.removeEventListener("focus", reload.current);
      document.removeEventListener("visibilitychange", reload.current);
    };
  }, [agent, pollMs]);

  useEffect(() => {
    if (!paused) reload.current();
  }, [paused]);

  useEffect(() => {
    if (target === undefined) return;
    let tries = 0;
    const timer = setInterval(() => {
      if (ref.current === target || ++tries > CATCH_UP_TRIES) {
        clearInterval(timer);
        return;
      }
      reload.current();
    }, CATCH_UP_MS);
    return () => clearInterval(timer);
  }, [target]);

  return state;
}
