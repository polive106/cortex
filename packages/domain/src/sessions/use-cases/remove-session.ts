import { SessionNotFoundError } from "../errors";
import type { SessionEnder, SessionIndex } from "../ports/session-index";

export class RemoveSession {
  constructor(private readonly index: SessionIndex) {}

  /**
   * Ends the owner's session in the runtime, then drops it from their list. A failed end keeps
   * the entry, so it can be retried. The ender comes per call: it's bound to one request.
   */
  async execute(owner: string, sessionId: string, runtime: SessionEnder): Promise<void> {
    if (!(await this.index.get(owner, sessionId))) throw new SessionNotFoundError(sessionId);
    await runtime.end(sessionId);
    await this.index.remove(owner, sessionId);
  }
}
