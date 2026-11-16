/** One entry in a user's session list (ADR-0013). */
export interface SessionSummary {
  readonly sessionId: string;
  /** The principalId of the user who started the session. */
  readonly owner: string;
  readonly title: string;
  readonly createdAt: Date;
  /** The last recorded activity; the list is sorted on it, newest first. */
  readonly updatedAt: Date;
}

/** eve ends a session after 30 idle days by default, and may then delete its history. */
export const DEFAULT_SESSION_TIMEOUT_MS = 30 * 24 * 60 * 60 * 1000;

/** A summary as the list shows it: `expired` once idle past the session timeout. */
export interface ListedSession extends SessionSummary {
  readonly expired: boolean;
}
