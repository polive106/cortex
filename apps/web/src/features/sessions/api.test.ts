import { describe, expect, it } from "vitest";
import { parseSessions, sessionsUrl } from "./api";

describe("sessionsUrl", () => {
  it("points at the agent's /sessions route, with an encoded id", () => {
    expect(sessionsUrl("companion")).toBe("/eve/companion/sessions");
    expect(sessionsUrl("companion", "a/b c")).toBe("/eve/companion/sessions?id=a%2Fb+c");
  });
});

describe("parseSessions", () => {
  it("keeps well-formed entries and drops the rest", () => {
    const good = { sessionId: "s1", title: "T", createdAt: "x", updatedAt: "y", expired: false };
    const noExpiry = { sessionId: "s2", title: "T", createdAt: "x", updatedAt: "y" };
    expect(parseSessions({ sessions: [good, noExpiry, { sessionId: 3 }, null] })).toEqual([good]);
  });

  it("is empty for anything that isn't a session list", () => {
    expect(parseSessions(null)).toEqual([]);
    expect(parseSessions({ sessions: "no" })).toEqual([]);
  });
});
