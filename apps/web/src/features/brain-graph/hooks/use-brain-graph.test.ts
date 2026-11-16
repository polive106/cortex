import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useBrainGraph } from "./use-brain-graph";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const node = (id: string) => ({ id, title: id, summary: "", kind: "page", degree: 0 });
const graph = (ref: string, ids: string[]) => () =>
  new Response(JSON.stringify({ ok: true, ref, nodes: ids.map(node), edges: [] }));
const notModified = () => new Response(null, { status: 304 });

/** Answers each load with the next response, then 304s. */
function serve(...responses: (() => Response)[]) {
  const fetch = vi.fn(async (_url: string, _init?: RequestInit) =>
    (responses.shift() ?? notModified)(),
  );
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

/** Window focus triggers a load, so tests step through loads without racing the poll timer. */
const refocus = () =>
  act(() => {
    window.dispatchEvent(new Event("focus"));
  });

describe("useBrainGraph", () => {
  it("loads the graph with the session cookie", async () => {
    const fetch = serve(graph("r1", ["wiki/a.md"]));
    const { result } = renderHook(() => useBrainGraph("companion", { pollMs: 60_000 }));
    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.graph?.ref).toBe("r1");
    expect(result.current.fresh.size).toBe(0);
    expect(fetch).toHaveBeenCalledWith("/eve/companion/brain/graph", {
      credentials: "same-origin",
      headers: {},
      signal: expect.any(AbortSignal),
    });
  });

  it("sends the last ref, keeps the graph on 304, and marks new nodes fresh", async () => {
    const fetch = serve(
      graph("r1", ["wiki/a.md"]),
      notModified,
      graph("r2", ["wiki/a.md", "wiki/b.md"]),
    );
    const { result } = renderHook(() => useBrainGraph("companion", { pollMs: 60_000 }));
    await waitFor(() => expect(result.current.graph?.ref).toBe("r1"));
    refocus();
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(fetch.mock.calls[1]?.[1]).toMatchObject({ headers: { "if-none-match": '"r1"' } });
    expect(result.current.graph?.ref).toBe("r1");
    refocus();
    await waitFor(() => expect(result.current.graph?.ref).toBe("r2"));
    expect([...result.current.fresh]).toEqual(["wiki/b.md"]);
  });

  it("polls on its own", async () => {
    const fetch = serve();
    renderHook(() => useBrainGraph("companion", { pollMs: 10 }));
    await waitFor(() => expect(fetch.mock.calls.length).toBeGreaterThan(2));
  });

  it("reports a refused load, then a network error, keeping the last graph", async () => {
    serve(
      graph("r1", ["wiki/a.md"]),
      () => new Response("no", { status: 500 }),
      () => {
        throw new TypeError("offline");
      },
    );
    const { result } = renderHook(() => useBrainGraph("companion", { pollMs: 60_000 }));
    await waitFor(() => expect(result.current.graph?.ref).toBe("r1"));
    refocus();
    await waitFor(() => expect(result.current.error).toBe("Couldn't load the brain (500)"));
    expect(result.current.status).toBe("error");
    expect(result.current.graph?.ref).toBe("r1");
    refocus();
    await waitFor(() => expect(result.current.error).toBe("Couldn't reach the brain"));
    refocus();
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.error).toBeUndefined();
  });

  it("catches up to a target commit, then stops", async () => {
    const fetch = serve(graph("r1", ["wiki/a.md"]), notModified, graph("r2", ["wiki/a.md"]));
    const { result, rerender } = renderHook(
      ({ target }) => useBrainGraph("companion", { pollMs: 60_000, target }),
      { initialProps: { target: undefined as string | undefined } },
    );
    await waitFor(() => expect(result.current.graph?.ref).toBe("r1"));
    rerender({ target: "r2" });
    await waitFor(() => expect(result.current.graph?.ref).toBe("r2"), { timeout: 3_000 });
    const calls = fetch.mock.calls.length;
    await new Promise((resolve) => setTimeout(resolve, 1_200));
    expect(fetch.mock.calls.length).toBe(calls);
  });

  it("gives up catching up after a while", async () => {
    const fetch = serve(graph("r1", []));
    renderHook(() => useBrainGraph("companion", { pollMs: 60_000, target: "never" }));
    await waitFor(() => expect(fetch.mock.calls.length).toBe(13), { timeout: 9_000 });
    await new Promise((resolve) => setTimeout(resolve, 1_200));
    expect(fetch.mock.calls.length).toBe(13);
  }, 15_000);

  it("waits while paused and loads once unpaused", async () => {
    const fetch = serve(graph("r1", []));
    const { result, rerender } = renderHook(
      ({ paused }) => useBrainGraph("companion", { pollMs: 60_000, paused }),
      { initialProps: { paused: true } },
    );
    refocus();
    expect(fetch).not.toHaveBeenCalled();
    rerender({ paused: false });
    await waitFor(() => expect(result.current.graph?.ref).toBe("r1"));
  });

  it("stops loading once unmounted", async () => {
    const fetch = serve(graph("r1", []));
    const { unmount } = renderHook(() => useBrainGraph("companion", { pollMs: 60_000 }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    unmount();
    window.dispatchEvent(new Event("focus"));
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
