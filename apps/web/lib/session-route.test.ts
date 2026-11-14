import { describe, expect, it, vi } from "vitest";
import { replaceSessionRoute, sessionPath } from "./session-route";

const fakeWindow = (pathname: string) => {
  const replaceState = vi.fn((_state: unknown, _unused: string, url: string) => {
    target.location.pathname = url;
  });
  const target = { location: { pathname }, history: { state: { keep: 1 }, replaceState } };
  return target;
};

describe("sessionPath", () => {
  it("encodes the session id into the /s route", () => {
    expect(sessionPath("a b/c")).toBe("/s/a%20b%2Fc");
  });
});

describe("replaceSessionRoute", () => {
  it("moves the URL to the session route, keeping history state", () => {
    const win = fakeWindow("/s");
    replaceSessionRoute(win, "abc", win.history.replaceState);
    expect(win.history.replaceState).toHaveBeenCalledWith({ keep: 1 }, "", "/s/abc");
  });

  it("does nothing when the URL already names the session, so streaming cannot hit Safari's replaceState rate limit", () => {
    const win = fakeWindow("/s");
    for (let i = 0; i < 500; i++) replaceSessionRoute(win, "abc", win.history.replaceState);
    expect(win.history.replaceState).toHaveBeenCalledTimes(1);
  });

  it("replaces again when the session changes", () => {
    const win = fakeWindow("/s/abc");
    replaceSessionRoute(win, "def", win.history.replaceState);
    expect(win.history.replaceState).toHaveBeenCalledWith({ keep: 1 }, "", "/s/def");
  });
});
