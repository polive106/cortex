import { InMemorySessionIndex } from "@cortex/adapters";
import { ListSessions, RecordSessionActivity, RemoveSession, RenameSession } from "@cortex/domain";
import { describe, expect, it, vi } from "vitest";
import { sessionsRoute } from "./sessions-route";

const at = (minute: number) => new Date(Date.UTC(2026, 10, 15, 9, minute));

async function setup() {
  const index = new InMemorySessionIndex();
  const record = new RecordSessionActivity(index);
  await record.execute({ owner: "alice", sessionId: "s1", message: "Plan the trip", at: at(1) });
  await record.execute({ owner: "alice", sessionId: "s2", message: "Draft", at: at(2) });
  await record.execute({ owner: "bob", sessionId: "s3", message: "Bob's", at: at(3) });
  const end = vi.fn(async (_sessionId: string) => {});
  const as = (principalId: string) => async (): Promise<unknown> => ({
    principalId,
    principalType: "user",
  });
  const routeAs = (authenticate: (request: Request) => Promise<unknown> = as("alice")) =>
    sessionsRoute({
      authenticate,
      listSessions: new ListSessions(index, { now: () => at(5) }),
      renameSession: new RenameSession(index),
      removeSession: new RemoveSession(index),
    });
  const request = (method: string, query = "", body?: string) =>
    new Request(`http://localhost/sessions${query}`, {
      method,
      ...(body === undefined ? {} : { body }),
    });
  const rename = (query: string, title: unknown, principal = "alice") =>
    routeAs(as(principal)).rename(request("PATCH", query, JSON.stringify({ title })));
  const remove = (query: string, principal = "alice") =>
    routeAs(as(principal)).remove(request("DELETE", query), { end });
  return { index, end, routeAs, request, rename, remove };
}

describe("sessionsRoute", () => {
  it("refuses a caller the auth walk refuses, on every method", async () => {
    const { routeAs, request, end } = await setup();
    const refusal = new Response("no", { status: 401 });
    const route = routeAs(async () => refusal);
    expect(await route.list(request("GET"))).toBe(refusal);
    expect(await route.rename(request("PATCH", "?id=s1", "{}"))).toBe(refusal);
    expect(await route.remove(request("DELETE", "?id=s1"), { end })).toBe(refusal);
  });

  it("lists the caller's sessions, newest first, uncached", async () => {
    const { routeAs, request } = await setup();
    const response = await routeAs().list(request("GET"));
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      sessions: [
        {
          sessionId: "s2",
          title: "Draft",
          createdAt: at(2).toISOString(),
          updatedAt: at(2).toISOString(),
          expired: false,
        },
        {
          sessionId: "s1",
          title: "Plan the trip",
          createdAt: at(1).toISOString(),
          updatedAt: at(1).toISOString(),
          expired: false,
        },
      ],
    });
  });

  it("renames one of the caller's sessions", async () => {
    const { rename, index } = await setup();
    const response = await rename("?id=s1", " Trip ");
    await expect(response.json()).resolves.toEqual({ ok: true, title: "Trip" });
    await expect(index.get("alice", "s1")).resolves.toMatchObject({ title: "Trip" });
  });

  it("answers 400 for a bad rename", async () => {
    const { rename, routeAs, request } = await setup();
    expect((await rename("?id=s1", "  ")).status).toBe(400);
    expect((await rename("?id=s1", 3)).status).toBe(400);
    expect((await rename("", "x")).status).toBe(400);
    expect((await routeAs().rename(request("PATCH", "?id=s1", "{"))).status).toBe(400);
  });

  it("answers 404 for another owner's session, and changes nothing", async () => {
    const { rename, remove, index, end } = await setup();
    const renamed = await rename("?id=s1", "Mine", "bob");
    expect(renamed.status).toBe(404);
    await expect(renamed.json()).resolves.toEqual({ ok: false, error: "No session s1" });
    expect((await remove("?id=s1", "bob")).status).toBe(404);
    expect(end).not.toHaveBeenCalled();
    await expect(index.get("alice", "s1")).resolves.toMatchObject({ title: "Plan the trip" });
  });

  it("deletes: ends the eve session, then removes it from the list", async () => {
    const { remove, index, end } = await setup();
    expect((await remove("?id=s1")).status).toBe(200);
    expect(end).toHaveBeenCalledWith("s1");
    await expect(index.get("alice", "s1")).resolves.toBeNull();
  });

  it("answers 400 for a delete without an id", async () => {
    const { remove } = await setup();
    expect((await remove("")).status).toBe(400);
  });

  it("lets other failures through to eve's error handling", async () => {
    const { remove, end } = await setup();
    end.mockRejectedValueOnce(new Error("eve is down"));
    await expect(remove("?id=s1")).rejects.toThrow("eve is down");
  });
});
