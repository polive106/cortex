import { describe, expect, it, vi } from "vitest";
import { DEFAULT_SESSION_TIMEOUT_MS } from "../entities/session-summary";
import { InvalidSessionTitleError, SessionNotFoundError } from "../errors";
import { FakeSessionIndex } from "../testing/fake-session-index";
import { ListSessions } from "./list-sessions";
import { RecordSessionActivity } from "./record-session-activity";
import { RemoveSession } from "./remove-session";
import { RenameSession } from "./rename-session";

const at = (minute: number) => new Date(Date.UTC(2026, 10, 15, 9, minute));

async function setup() {
  const index = new FakeSessionIndex();
  const record = new RecordSessionActivity(index);
  await record.execute({ owner: "alice", sessionId: "s1", message: "Plan the trip", at: at(1) });
  await record.execute({ owner: "alice", sessionId: "s2", message: "Draft a memo", at: at(2) });
  await record.execute({ owner: "bob", sessionId: "s3", message: "Bob's", at: at(3) });
  return { index, record };
}

describe("RecordSessionActivity", () => {
  it("names a new session after its first message", async () => {
    const { index } = await setup();
    await expect(index.get("alice", "s1")).resolves.toEqual({
      sessionId: "s1",
      owner: "alice",
      title: "Plan the trip",
      createdAt: at(1),
      updatedAt: at(1),
    });
  });

  it("keeps the title and bumps the time on later activity", async () => {
    const { index, record } = await setup();
    await record.execute({ owner: "alice", sessionId: "s1", message: "Another", at: at(9) });
    await expect(index.get("alice", "s1")).resolves.toMatchObject({
      title: "Plan the trip",
      createdAt: at(1),
      updatedAt: at(9),
    });
  });

  it("refuses activity without an owner or a session", async () => {
    const { record } = await setup();
    await expect(
      record.execute({ owner: "", sessionId: "s", message: "x", at: at(1) }),
    ).rejects.toThrow("owner and sessionId are required");
    await expect(
      record.execute({ owner: "a", sessionId: "", message: "x", at: at(1) }),
    ).rejects.toThrow("owner and sessionId are required");
  });
});

describe("ListSessions", () => {
  const clock = (date: Date) => ({ now: () => date });

  it("lists only the owner's sessions, newest first", async () => {
    const { index } = await setup();
    const sessions = await new ListSessions(index, clock(at(3))).execute("alice");
    expect(sessions.map((s) => s.sessionId)).toEqual(["s2", "s1"]);
    expect(sessions.map((s) => s.expired)).toEqual([false, false]);
  });

  it("caps the list", async () => {
    const { index } = await setup();
    await expect(new ListSessions(index, clock(at(3))).execute("alice", 1)).resolves.toHaveLength(
      1,
    );
  });

  it("marks sessions idle past the timeout as expired, 30 days by default", async () => {
    const { index } = await setup();
    const later = new Date(at(1).getTime() + DEFAULT_SESSION_TIMEOUT_MS + 30_000);
    const sessions = await new ListSessions(index, clock(later)).execute("alice");
    expect(sessions.map((s) => [s.sessionId, s.expired])).toEqual([
      ["s2", false],
      ["s1", true],
    ]);
    const short = await new ListSessions(index, clock(at(5)), 60_000).execute("alice");
    expect(short.map((s) => s.expired)).toEqual([true, true]);
  });
});

describe("RenameSession", () => {
  it("renames the owner's session and keeps the rename through later turns", async () => {
    const { index, record } = await setup();
    await expect(new RenameSession(index).execute("alice", "s1", " Trip ")).resolves.toEqual({
      title: "Trip",
    });
    await record.execute({ owner: "alice", sessionId: "s1", message: "more", at: at(9) });
    await expect(index.get("alice", "s1")).resolves.toMatchObject({ title: "Trip" });
  });

  it("refuses an empty title", async () => {
    const { index } = await setup();
    await expect(new RenameSession(index).execute("alice", "s1", " ")).rejects.toThrow(
      InvalidSessionTitleError,
    );
  });

  it("can't rename another owner's session", async () => {
    const { index } = await setup();
    await expect(new RenameSession(index).execute("bob", "s1", "Mine")).rejects.toThrow(
      SessionNotFoundError,
    );
    await expect(index.get("alice", "s1")).resolves.toMatchObject({ title: "Plan the trip" });
  });
});

describe("RemoveSession", () => {
  it("ends the session, then removes it from the owner's list", async () => {
    const { index } = await setup();
    const end = vi.fn(async () => {});
    await new RemoveSession(index).execute("alice", "s1", { end });
    expect(end).toHaveBeenCalledWith("s1");
    await expect(index.get("alice", "s1")).resolves.toBeNull();
  });

  it("keeps the entry when ending fails, so it can be retried", async () => {
    const { index } = await setup();
    const end = vi.fn(async () => {
      throw new Error("eve is down");
    });
    await expect(new RemoveSession(index).execute("alice", "s1", { end })).rejects.toThrow(
      "eve is down",
    );
    await expect(index.get("alice", "s1")).resolves.not.toBeNull();
  });

  it("can't remove or end another owner's session", async () => {
    const { index } = await setup();
    const end = vi.fn(async () => {});
    await expect(new RemoveSession(index).execute("bob", "s1", { end })).rejects.toThrow(
      "No session s1",
    );
    expect(end).not.toHaveBeenCalled();
  });
});
