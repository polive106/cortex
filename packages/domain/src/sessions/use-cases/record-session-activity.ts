import { SessionTitle } from "../entities/session-title";
import { InvalidSessionActivityError } from "../errors";
import type { SessionIndex } from "../ports/session-index";

export interface RecordSessionActivityRequest {
  readonly owner: string;
  readonly sessionId: string;
  /** The message's text; it names the session if this is its first activity. */
  readonly message: string;
  readonly at: Date;
}

export class RecordSessionActivity {
  constructor(private readonly index: SessionIndex) {}

  async execute({ owner, sessionId, message, at }: RecordSessionActivityRequest): Promise<void> {
    if (!owner || !sessionId) {
      throw new InvalidSessionActivityError("owner and sessionId are required");
    }
    await this.index.record({ owner, sessionId, title: SessionTitle.fromMessage(message), at });
  }
}
