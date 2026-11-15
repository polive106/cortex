import type { Clock } from "../../wiki/ports/clock";
import { DEFAULT_SESSION_TIMEOUT_MS, type ListedSession } from "../entities/session-summary";
import type { SessionIndex } from "../ports/session-index";

const LIMIT = 50;

export class ListSessions {
  constructor(
    private readonly index: SessionIndex,
    private readonly clock: Clock,
    /** The agent's session timeout: idle longer, and eve may no longer have the conversation. */
    private readonly timeoutMs = DEFAULT_SESSION_TIMEOUT_MS,
  ) {}

  /** The owner's most recent sessions, newest first, each marked expired or not. */
  async execute(owner: string, limit = LIMIT): Promise<ListedSession[]> {
    const now = this.clock.now().getTime();
    const sessions = await this.index.list(owner, limit);
    return sessions.map((s) => ({ ...s, expired: now - s.updatedAt.getTime() > this.timeoutMs }));
  }
}
