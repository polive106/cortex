import { useCallback, useEffect, useState } from "react";
import { parseSessions, type SessionEntry, sessionsUrl } from "../api";

export interface SessionsState {
  readonly status: "loading" | "ready" | "error";
  readonly sessions: readonly SessionEntry[];
  /** Why the last load or change failed, until the next one succeeds. */
  readonly error: string | undefined;
  /** Resolves false when the change was refused; `error` then says why. */
  readonly rename: (sessionId: string, title: string) => Promise<boolean>;
  readonly remove: (sessionId: string) => Promise<boolean>;
}

const OPTIONS = { credentials: "same-origin" } as const;

async function failureOf(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as { error?: unknown } | null;
  return typeof body?.error === "string"
    ? body.error
    : `Couldn't update the session (${response.status})`;
}

/**
 * The signed-in user's sessions from the agent's `/sessions` route (ADR-0013). Loads again
 * whenever `refreshKey` changes; while it's undefined (a turn is running), the list waits.
 */
export function useSessions(agent: string, refreshKey: string | undefined): SessionsState {
  const [status, setStatus] = useState<SessionsState["status"]>("loading");
  const [sessions, setSessions] = useState<readonly SessionEntry[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (refreshKey === undefined) return;
    const controller = new AbortController();
    fetch(sessionsUrl(agent), { ...OPTIONS, signal: controller.signal })
      .then(async (response) => {
        const loaded = response.ok ? parseSessions(await response.json()) : response.status;
        if (controller.signal.aborted) return;
        if (typeof loaded === "number") {
          setStatus("error");
          setError(`Couldn't load your sessions (${loaded})`);
          return;
        }
        setSessions(loaded);
        setStatus("ready");
        setError(undefined);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setStatus("error");
        setError("Couldn't load your sessions");
      });
    return () => controller.abort();
  }, [agent, refreshKey]);

  const change = useCallback(
    async (sessionId: string, init: RequestInit, apply: (body: unknown) => void) => {
      try {
        const response = await fetch(sessionsUrl(agent, sessionId), { ...init, ...OPTIONS });
        if (!response.ok) {
          setError(await failureOf(response));
          return false;
        }
        apply(await response.json());
        setError(undefined);
        return true;
      } catch {
        setError("Couldn't update the session");
        return false;
      }
    },
    [agent],
  );

  const rename = useCallback(
    (sessionId: string, title: string) =>
      change(
        sessionId,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title }),
        },
        (body) => {
          const renamed = (body as { title: string }).title;
          setSessions((all) =>
            all.map((s) => (s.sessionId === sessionId ? { ...s, title: renamed } : s)),
          );
        },
      ),
    [change],
  );

  const remove = useCallback(
    (sessionId: string) =>
      change(sessionId, { method: "DELETE" }, () =>
        setSessions((all) => all.filter((s) => s.sessionId !== sessionId)),
      ),
    [change],
  );

  return { status, sessions, error, rename, remove };
}
