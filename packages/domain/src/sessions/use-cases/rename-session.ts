import { SessionTitle } from "../entities/session-title";
import { SessionNotFoundError } from "../errors";
import type { SessionIndex } from "../ports/session-index";

export class RenameSession {
  constructor(private readonly index: SessionIndex) {}

  async execute(owner: string, sessionId: string, title: string): Promise<{ title: string }> {
    const parsed = SessionTitle.parse(title);
    if (!(await this.index.rename(owner, sessionId, parsed))) {
      throw new SessionNotFoundError(sessionId);
    }
    return { title: parsed };
  }
}
