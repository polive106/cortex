import { WikiError } from "../wiki/errors";

/** No session with that ID belongs to the caller (it may be someone else's). */
export class SessionNotFoundError extends WikiError {
  constructor(readonly sessionId: string) {
    super(`No session ${sessionId}`);
  }
}

export class InvalidSessionTitleError extends WikiError {}

/** The activity to record is missing who or which session it's about. */
export class InvalidSessionActivityError extends WikiError {}
