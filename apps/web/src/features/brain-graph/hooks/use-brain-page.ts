import { useEffect, useRef, useState } from "react";
import { type BrainPage, brainPageUrl, parseBrainPage } from "../api";

export type BrainPageStatus = "idle" | "loading" | "ready" | "missing" | "error";

export interface BrainPageState {
  /** `loading` keeps the last page shown, so moving between pages doesn't flash empty. */
  readonly status: BrainPageStatus;
  readonly page: BrainPage | undefined;
}

/**
 * One brain page from the agent's `/brain/page` route, for the reader (E7-US04). It loads again
 * when the path changes or the brain's head moves (`ref`), so a page the agent rewrites updates;
 * not when the head it learns of is the one the page was already read at.
 */
export function useBrainPage(
  agent: string,
  path: string | undefined,
  ref: string | undefined,
): BrainPageState {
  const [state, setState] = useState<BrainPageState>({ status: "idle", page: undefined });
  const loaded = useRef<BrainPage | undefined>(undefined);

  // `ref` isn't read inside: a new head is just a reason to load again.
  useEffect(() => {
    if (path === undefined) {
      loaded.current = undefined;
      setState({ status: "idle", page: undefined });
      return;
    }
    const last = loaded.current;
    if (last?.path === path && (ref === undefined || ref === last.ref)) return;
    const controller = new AbortController();
    setState((current) => ({ ...current, status: "loading" }));
    (async () => {
      try {
        const response = await fetch(brainPageUrl(agent, path), {
          credentials: "same-origin",
          signal: controller.signal,
        });
        const page = response.ok ? parseBrainPage(await response.json()) : undefined;
        if (controller.signal.aborted) return;
        loaded.current = page;
        if (page) setState({ status: "ready", page });
        else setState({ status: response.status === 404 ? "missing" : "error", page: undefined });
      } catch {
        if (!controller.signal.aborted) setState({ status: "error", page: undefined });
      }
    })();
    return () => controller.abort();
  }, [agent, path, ref]);

  return state;
}
