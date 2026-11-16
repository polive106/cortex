/** One entry in the session sidebar, as `GET /eve/<agent>/sessions` returns it (ADR-0013). */
export interface SessionEntry {
  readonly sessionId: string;
  readonly title: string;
  /** ISO timestamps. */
  readonly createdAt: string;
  readonly updatedAt: string;
  /** Idle past the agent's session timeout: eve may no longer have the conversation. */
  readonly expired: boolean;
}

/** The companion route behind the list (agents/companion/agent/channels/sessions.ts). */
export function sessionsUrl(agent: string, sessionId?: string): string {
  const base = `/eve/${agent}/sessions`;
  return sessionId === undefined ? base : `${base}?${new URLSearchParams({ id: sessionId })}`;
}

function isEntry(value: unknown): value is SessionEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    ["sessionId", "title", "createdAt", "updatedAt"].every(
      (key) => typeof entry[key] === "string",
    ) && typeof entry.expired === "boolean"
  );
}

/** The well-formed entries of a `GET /sessions` body. */
export function parseSessions(body: unknown): SessionEntry[] {
  const sessions = (body as { sessions?: unknown } | null)?.sessions;
  return Array.isArray(sessions) ? sessions.filter(isEntry) : [];
}
