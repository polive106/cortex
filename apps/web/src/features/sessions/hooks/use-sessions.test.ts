import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useSessions } from "./use-sessions";

afterEach(() => vi.unstubAllGlobals());

const entry = (sessionId: string, title = sessionId) => ({
  sessionId,
  title,
  createdAt: "2026-11-15T09:00:00.000Z",
  updatedAt: "2026-11-15T09:00:00.000Z",
  expired: false,
});
const list = (...ids: string[]) => Response.json({ sessions: ids.map((id) => entry(id)) });

describe("useSessions", () => {
  it("loads the list with the session cookie", async () => {
    const fetch = vi.fn(async () => list("s1", "s2"));
    vi.stubGlobal("fetch", fetch);
    const { result } = renderHook(() => useSessions("companion", "k"));
    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.sessions.map((s) => s.sessionId)).toEqual(["s1", "s2"]);
    expect(fetch).toHaveBeenCalledWith("/eve/companion/sessions", {
      credentials: "same-origin",
      signal: expect.any(AbortSignal),
    });
  });

  it("reloads when the refresh key changes, keeping the list meanwhile", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(list("s1")).mockResolvedValueOnce(list("s2", "s1"));
    vi.stubGlobal("fetch", fetch);
    const { result, rerender } = renderHook(({ key }) => useSessions("a", key), {
      initialProps: { key: "1" },
    });
    await waitFor(() => expect(result.current.sessions).toHaveLength(1));
    rerender({ key: "2" });
    expect(result.current.sessions).toHaveLength(1);
    await waitFor(() => expect(result.current.sessions).toHaveLength(2));
  });

  it("waits while there's no refresh key, such as during a turn", async () => {
    const fetch = vi.fn(async () => list("s1"));
    vi.stubGlobal("fetch", fetch);
    const { result, rerender } = renderHook(({ key }) => useSessions("a", key), {
      initialProps: { key: undefined as string | undefined },
    });
    expect(result.current.status).toBe("loading");
    expect(fetch).not.toHaveBeenCalled();
    rerender({ key: "1" });
    await waitFor(() => expect(result.current.status).toBe("ready"));
  });

  it("reports a failed load", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("no", { status: 500 })),
    );
    const { result } = renderHook(() => useSessions("a", "k"));
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toBe("Couldn't load your sessions (500)");
  });

  it("reports a network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("offline");
      }),
    );
    const { result } = renderHook(() => useSessions("a", "k"));
    await waitFor(() => expect(result.current.error).toBe("Couldn't load your sessions"));
  });

  it("drops a stale response after a newer load", async () => {
    let resolveFirst: (response: Response) => void = () => {};
    const fetch = vi
      .fn()
      .mockImplementationOnce(() => new Promise<Response>((resolve) => (resolveFirst = resolve)))
      .mockImplementationOnce(async () => list("new"));
    vi.stubGlobal("fetch", fetch);
    const { result, rerender } = renderHook(({ key }) => useSessions("a", key), {
      initialProps: { key: "1" },
    });
    rerender({ key: "2" });
    await waitFor(() => expect(result.current.sessions.map((s) => s.sessionId)).toEqual(["new"]));
    resolveFirst(list("old"));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(result.current.sessions.map((s) => s.sessionId)).toEqual(["new"]);
  });

  it("renames a session in place", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(list("s1"))
      .mockResolvedValueOnce(Response.json({ ok: true, title: "Trip" }));
    vi.stubGlobal("fetch", fetch);
    const { result } = renderHook(() => useSessions("a", "k"));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    await act(async () => expect(await result.current.rename("s1", " Trip ")).toBe(true));
    expect(result.current.sessions[0]?.title).toBe("Trip");
    expect(fetch).toHaveBeenLastCalledWith("/eve/a/sessions?id=s1", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: " Trip " }),
    });
  });

  it("deletes a session from the list", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(list("s1", "s2"))
      .mockResolvedValueOnce(Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetch);
    const { result } = renderHook(() => useSessions("a", "k"));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    await act(async () => expect(await result.current.remove("s1")).toBe(true));
    expect(result.current.sessions.map((s) => s.sessionId)).toEqual(["s2"]);
    expect(fetch).toHaveBeenLastCalledWith("/eve/a/sessions?id=s1", {
      method: "DELETE",
      credentials: "same-origin",
    });
  });

  it("keeps the list and says why when a change is refused", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(list("s1"))
      .mockResolvedValueOnce(
        Response.json({ ok: false, error: "A title can't be empty" }, { status: 400 }),
      )
      .mockResolvedValueOnce(new Response("oops", { status: 502 }))
      .mockRejectedValueOnce(new TypeError("offline"));
    vi.stubGlobal("fetch", fetch);
    const { result } = renderHook(() => useSessions("a", "k"));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    await act(async () => expect(await result.current.rename("s1", " ")).toBe(false));
    expect(result.current.error).toBe("A title can't be empty");
    await act(async () => expect(await result.current.remove("s1")).toBe(false));
    expect(result.current.error).toBe("Couldn't update the session (502)");
    await act(async () => expect(await result.current.remove("s1")).toBe(false));
    expect(result.current.error).toBe("Couldn't update the session");
    expect(result.current.sessions).toHaveLength(1);
  });
});
