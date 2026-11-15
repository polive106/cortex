import { describe, expect, it } from "vitest";
import { InvalidSessionTitleError } from "../errors";
import { DEFAULT_SESSION_TITLE, MAX_TITLE_LENGTH, SessionTitle } from "./session-title";

describe("SessionTitle.fromMessage", () => {
  it("collapses whitespace in the first message", () => {
    expect(SessionTitle.fromMessage("  Plan the\n\ttrip  ")).toBe("Plan the trip");
  });

  it("falls back to the default title for an empty message", () => {
    expect(SessionTitle.fromMessage(" \n ")).toBe(DEFAULT_SESSION_TITLE);
  });

  it("cuts a long message at a word, with an ellipsis", () => {
    const title = SessionTitle.fromMessage(`${"word ".repeat(40)}`);
    expect(title.length).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
    expect(title).toMatch(/^word( word)*…$/);
  });

  it("cuts a long single word at the limit", () => {
    const title = SessionTitle.fromMessage("x".repeat(200));
    expect(title).toBe(`${"x".repeat(MAX_TITLE_LENGTH - 1)}…`);
  });
});

describe("SessionTitle.parse", () => {
  it("accepts a title someone typed, trimmed", () => {
    expect(SessionTitle.parse("  Trip  ")).toBe("Trip");
  });

  it("refuses an empty title", () => {
    expect(() => SessionTitle.parse("   ")).toThrow(InvalidSessionTitleError);
  });

  it("refuses a title over the limit", () => {
    expect(() => SessionTitle.parse("x".repeat(MAX_TITLE_LENGTH + 1))).toThrow(
      `A title has at most ${MAX_TITLE_LENGTH} characters`,
    );
  });
});
