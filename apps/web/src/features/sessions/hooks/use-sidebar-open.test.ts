import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useSidebarOpen } from "./use-sidebar-open";

afterEach(() => vi.unstubAllGlobals());

const screen = (wide: boolean) =>
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: wide, media: query }));

describe("useSidebarOpen", () => {
  it("leaves the first render to CSS, so the server and the browser agree", () => {
    const { result } = renderHook(() => useSidebarOpen());
    expect(result.current.open).toBeUndefined();
  });

  it("closes from the screen's default on a wide screen, then reopens", () => {
    screen(true);
    const { result } = renderHook(() => useSidebarOpen());
    act(() => result.current.toggle());
    expect(result.current.open).toBe(false);
    act(() => result.current.toggle());
    expect(result.current.open).toBe(true);
  });

  it("opens from the screen's default on a small screen", () => {
    screen(false);
    const { result } = renderHook(() => useSidebarOpen());
    act(() => result.current.toggle());
    expect(result.current.open).toBe(true);
  });
});
