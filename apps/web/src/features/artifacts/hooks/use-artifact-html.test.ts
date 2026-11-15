import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useArtifactHtml } from "./use-artifact-html";

afterEach(() => vi.unstubAllGlobals());

const respond = (body: string, status = 200) => vi.fn(async () => new Response(body, { status }));

describe("useArtifactHtml", () => {
  it("is idle without a URL", () => {
    const { result } = renderHook(() => useArtifactHtml(undefined));
    expect(result.current).toEqual({ status: "idle" });
  });

  it("loads the page with the session cookie", async () => {
    const fetch = respond("<p>hi</p>");
    vi.stubGlobal("fetch", fetch);
    const { result } = renderHook(() => useArtifactHtml("/eve/a/artifacts?path=out%2Fa.html"));
    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current).toEqual({ status: "ready", html: "<p>hi</p>" }));
    expect(fetch).toHaveBeenCalledWith("/eve/a/artifacts?path=out%2Fa.html", {
      credentials: "same-origin",
      signal: expect.any(AbortSignal),
    });
  });

  it("reports a failed load", async () => {
    vi.stubGlobal("fetch", respond("nope", 404));
    const { result } = renderHook(() => useArtifactHtml("/x"));
    await waitFor(() =>
      expect(result.current).toEqual({
        status: "error",
        error: "Couldn't load the artifact (404)",
      }),
    );
  });

  it("reports a network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("offline");
      }),
    );
    const { result } = renderHook(() => useArtifactHtml("/x"));
    await waitFor(() =>
      expect(result.current).toEqual({ status: "error", error: "Couldn't load the artifact" }),
    );
  });

  it("drops a stale response when the URL changes", async () => {
    let resolveFirst: (response: Response) => void = () => {};
    const fetch = vi
      .fn()
      .mockImplementationOnce(() => new Promise<Response>((resolve) => (resolveFirst = resolve)))
      .mockImplementationOnce(async () => new Response("<p>second</p>"));
    vi.stubGlobal("fetch", fetch);
    const { result, rerender } = renderHook(({ url }) => useArtifactHtml(url), {
      initialProps: { url: "/first" },
    });
    rerender({ url: "/second" });
    await waitFor(() => expect(result.current).toEqual({ status: "ready", html: "<p>second</p>" }));
    resolveFirst(new Response("<p>first</p>"));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(result.current).toEqual({ status: "ready", html: "<p>second</p>" });
  });
});
