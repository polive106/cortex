import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useBrainPage } from "./use-brain-page";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const page = (path: string, body = "# Page") => ({
  ok: true,
  ref: "r1",
  path,
  title: path,
  summary: "",
  updated: "",
  body,
});

function serve(...responses: (() => Response)[]) {
  const fetch = vi.fn(async (_url: string, _init?: RequestInit) => {
    const next = responses.shift();
    if (!next) throw new Error("no more responses");
    return next();
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

describe("useBrainPage", () => {
  it("stays idle without a path", () => {
    const fetch = serve();
    const { result } = renderHook(() => useBrainPage("companion", undefined, "r1"));
    expect(result.current).toEqual({ status: "idle", page: undefined });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("loads the page with the session cookie, and again when the head moves", async () => {
    const fetch = serve(
      () => Response.json(page("wiki/a.md", "old")),
      () => Response.json(page("wiki/a.md", "new")),
    );
    const { result, rerender } = renderHook(
      ({ ref }) => useBrainPage("companion", "wiki/a.md", ref),
      { initialProps: { ref: "r1" } },
    );
    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.page?.body).toBe("old"));
    expect(fetch).toHaveBeenCalledWith("/eve/companion/brain/page?path=wiki%2Fa.md", {
      credentials: "same-origin",
      signal: expect.any(AbortSignal),
    });
    rerender({ ref: "r2" });
    // The old page stays while the new one loads.
    expect(result.current).toMatchObject({ status: "loading", page: { body: "old" } });
    await waitFor(() => expect(result.current.page?.body).toBe("new"));
    expect(result.current.status).toBe("ready");
  });

  it("tells a missing page from a failure", async () => {
    serve(
      () => Response.json({ ok: false }, { status: 404 }),
      () => new Response("no", { status: 500 }),
      () => {
        throw new TypeError("offline");
      },
    );
    const { result, rerender } = renderHook(({ path }) => useBrainPage("companion", path, "r1"), {
      initialProps: { path: "wiki/a.md" },
    });
    await waitFor(() => expect(result.current.status).toBe("missing"));
    rerender({ path: "wiki/b.md" });
    await waitFor(() => expect(result.current.status).toBe("error"));
    rerender({ path: "wiki/c.md" });
    await waitFor(() => expect(result.current.status).toBe("loading"));
    await waitFor(() => expect(result.current.status).toBe("error"));
  });

  it("goes idle again when the path is cleared", async () => {
    serve(() => Response.json(page("wiki/a.md")));
    const { result, rerender } = renderHook(
      ({ path }: { path?: string }) => useBrainPage("companion", path, "r1"),
      { initialProps: { path: "wiki/a.md" } as { path?: string } },
    );
    await waitFor(() => expect(result.current.status).toBe("ready"));
    rerender({ path: undefined });
    expect(result.current).toEqual({ status: "idle", page: undefined });
  });
});
