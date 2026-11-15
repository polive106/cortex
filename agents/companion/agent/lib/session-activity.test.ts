import { describe, expect, it } from "vitest";
import { webActivity } from "./session-activity";

const user = { principalId: "u1", principalType: "user" };
const now = new Date("2026-11-15T09:00:00Z");
const text = (value: string) => ({ kind: "text" as const, text: value });

describe("webActivity", () => {
  it("records a user's message under their principal, named by its text", () => {
    expect(
      webActivity({
        sessionId: "s1",
        initiator: user,
        parts: [text("Plan the"), text("trip")],
        now,
      }),
    ).toEqual({ owner: "u1", sessionId: "s1", message: "Plan the trip", at: now });
  });

  it("records a files-only message with an empty text, so it gets the default title", () => {
    const file = { kind: "file" as const, mediaType: "image/png" };
    expect(webActivity({ sessionId: "s", initiator: user, parts: [file], now })?.message).toBe("");
  });

  it("skips a delivery that only adds context", () => {
    expect(webActivity({ sessionId: "s", initiator: user, parts: [], now })).toBeNull();
  });

  it("skips sessions without a person behind them", () => {
    const parts = [text("hi")];
    expect(webActivity({ sessionId: "s", initiator: null, parts, now })).toBeNull();
    for (const principalType of ["runtime", "service"]) {
      const initiator = { principalId: "eve:app", principalType };
      expect(webActivity({ sessionId: "s", initiator, parts, now })).toBeNull();
    }
  });
});
