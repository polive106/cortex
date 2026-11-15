import type { SessionSummary } from "../entities/session-summary";

export interface SessionActivity {
  readonly owner: string;
  readonly sessionId: string;
  /** Used only when the session is new: later activity never changes the title. */
  readonly title: string;
  readonly at: Date;
}

/** Each user's list of sessions (ADR-0013). Every call is scoped by owner. */
export interface SessionIndex {
  /** Creates the entry with `title`, or bumps `updatedAt` on an existing one. */
  record(activity: SessionActivity): Promise<void>;
  /** The owner's sessions, newest activity first. */
  list(owner: string, limit: number): Promise<SessionSummary[]>;
  get(owner: string, sessionId: string): Promise<SessionSummary | null>;
  /** False when the owner has no such session. */
  rename(owner: string, sessionId: string, title: string): Promise<boolean>;
  /** False when the owner has no such session. */
  remove(owner: string, sessionId: string): Promise<boolean>;
}

/** Ends a session in the agent runtime (eve), so a deleted session can't be resumed. */
export interface SessionEnder {
  end(sessionId: string): Promise<void>;
}
