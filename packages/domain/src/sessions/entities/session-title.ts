import { collapseWhitespace } from "../../wiki/entities/text";
import { InvalidSessionTitleError } from "../errors";

export const MAX_TITLE_LENGTH = 80;
export const DEFAULT_SESSION_TITLE = "New chat";

/** Session titles for the sidebar (ADR-0013): one line, at most MAX_TITLE_LENGTH characters. */
export const SessionTitle = {
  /** A title from the session's first message: cut at a word, with an ellipsis, if too long. */
  fromMessage(message: string): string {
    const text = collapseWhitespace(message);
    if (text.length === 0) return DEFAULT_SESSION_TITLE;
    if (text.length <= MAX_TITLE_LENGTH) return text;
    const head = text.slice(0, MAX_TITLE_LENGTH - 1);
    const lastSpace = head.lastIndexOf(" ");
    return `${lastSpace > 0 ? head.slice(0, lastSpace) : head}…`;
  },

  /** A title someone typed. Refuses an empty or over-long one instead of cutting it. */
  parse(input: string): string {
    const title = collapseWhitespace(input);
    if (title.length === 0) throw new InvalidSessionTitleError("A title can't be empty");
    if (title.length > MAX_TITLE_LENGTH) {
      throw new InvalidSessionTitleError(`A title has at most ${MAX_TITLE_LENGTH} characters`);
    }
    return title;
  },
};
