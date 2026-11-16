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

export const POLL_MS = 5_000;

/**
 * The brain graph from the agent's `/brain/graph` route, kept live (E7-US01, ADR-0015): it polls
 * every `pollMs` while the tab is visible, and when it regains focus, sending the last ref as `If-None-Match`, so an
 * unchanged brain answers 304 and nothing re-renders.
 */
export function useBrainGraph(agent: string, pollMs = POLL_MS): BrainGraphState {
  const [state, setState] = useState<BrainGraphState>({
    status: "loading",
    graph: undefined,
    fresh: new Set(),
    error: undefined,
  });
  const ref = useRef<string | undefined>(undefined);

  useEffect(() => {
    const controller = new AbortController();
    let inFlight = false;

    const fail = (error: string) => setState((current) => ({ ...current, status: "error", error }));

    const load = async () => {
      // A hidden tab waits: focus or becoming visible loads straight away.
      if (inFlight || document.hidden) return;
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

    void load();
    const timer = setInterval(load, pollMs);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      controller.abort();
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [agent, pollMs]);

  return state;
}
