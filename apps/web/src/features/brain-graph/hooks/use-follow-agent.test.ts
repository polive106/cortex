import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TrailStep } from "../api";
import { FOLLOW_ZOOM, type FollowOptions, SETTLE_MS, useFollowAgent } from "./use-follow-agent";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const step = (id: string, path: string): TrailStep => ({ id, path, action: "read", active: false });
const placed = new Map([
  ["wiki/a.md", { x: 10, y: 20 }],
  ["wiki/b.md", { x: -30, y: 40 }],
]);

function setup(initial: Partial<FollowOptions> = {}) {
  const viewport = {
    glideTo: vi.fn(),
    fit: vi.fn(),
    userMoved: false,
    resetUserMoved: vi.fn(),
  };
  const props: FollowOptions = {
    busy: true,
    latest: undefined,
    positions: placed,
    viewport,
    ...initial,
  };
  const hook = renderHook((p: FollowOptions) => useFollowAgent(p), { initialProps: props });
  const update = (change: Partial<FollowOptions>) => {
    Object.assign(props, change);
    hook.rerender({ ...props });
  };
  return { ...hook, viewport, update };
}

describe("useFollowAgent", () => {
  it("glides to each new step's page, once per step", () => {
    const { result, viewport, update } = setup({ latest: step("s1", "wiki/a.md") });
    expect(result.current.following).toBe(true);
    expect(viewport.glideTo).toHaveBeenLastCalledWith({ x: 10, y: 20 }, FOLLOW_ZOOM);
    update({ positions: new Map(placed) });
    expect(viewport.glideTo).toHaveBeenCalledTimes(1);
    update({ latest: step("s2", "wiki/b.md") });
    expect(viewport.glideTo).toHaveBeenLastCalledWith({ x: -30, y: 40 }, FOLLOW_ZOOM);
  });

  it("waits for a page that isn't placed yet", () => {
    const { viewport, update } = setup({ latest: step("w", "wiki/new.md") });
    expect(viewport.glideTo).not.toHaveBeenCalled();
    update({ positions: new Map([...placed, ["wiki/new.md", { x: 5, y: 5 }]]) });
    expect(viewport.glideTo).toHaveBeenCalledWith({ x: 5, y: 5 }, FOLLOW_ZOOM);
  });

  it("leaves steps from before the panel opened alone, outside a turn", () => {
    const { viewport } = setup({ busy: false, latest: step("old", "wiki/a.md") });
    expect(viewport.glideTo).not.toHaveBeenCalled();
  });

  it("pauses while the person has moved the view", () => {
    const { result, viewport, update } = setup({ latest: step("s1", "wiki/a.md") });
    update({ viewport: { ...viewport, userMoved: true }, latest: step("s2", "wiki/b.md") });
    expect(result.current.following).toBe(false);
    expect(viewport.glideTo).toHaveBeenCalledTimes(1);
  });

  it("turns off, and back on going to the latest step again", () => {
    const { result, viewport } = setup({ latest: step("s1", "wiki/a.md") });
    act(() => result.current.toggle());
    expect(result.current.following).toBe(false);
    act(() => result.current.toggle());
    expect(result.current.following).toBe(true);
    expect(viewport.resetUserMoved).toHaveBeenCalled();
    expect(viewport.glideTo).toHaveBeenCalledTimes(2);
  });

  it("eases back out to the whole brain after the turn", () => {
    const { viewport, update } = setup({ latest: step("s1", "wiki/a.md") });
    update({ busy: false });
    vi.advanceTimersByTime(SETTLE_MS - 1);
    expect(viewport.fit).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(viewport.fit).toHaveBeenCalled();
    expect(viewport.resetUserMoved).toHaveBeenCalled();
  });

  it("leaves a view the person moved, or turned off, where it is when the turn ends", () => {
    const moved = setup({ latest: step("s1", "wiki/a.md") });
    moved.update({ viewport: { ...moved.viewport, userMoved: true } });
    moved.update({ busy: false });
    vi.advanceTimersByTime(SETTLE_MS);
    expect(moved.viewport.fit).not.toHaveBeenCalled();
    expect(moved.viewport.resetUserMoved).toHaveBeenCalled();
    cleanup();
    const off = setup({ latest: step("s1", "wiki/a.md") });
    act(() => off.result.current.toggle());
    off.update({ busy: false });
    vi.advanceTimersByTime(SETTLE_MS);
    expect(off.viewport.fit).not.toHaveBeenCalled();
  });

  it("doesn't zoom back in for a page placed after the turn eased out", () => {
    const { viewport, update } = setup({ latest: step("s1", "wiki/a.md") });
    update({ latest: step("w", "wiki/new.md"), busy: false });
    vi.advanceTimersByTime(SETTLE_MS);
    update({ positions: new Map([...placed, ["wiki/new.md", { x: 5, y: 5 }]]) });
    expect(viewport.glideTo).toHaveBeenCalledTimes(1);
    update({ busy: true, latest: step("s3", "wiki/b.md") });
    expect(viewport.glideTo).toHaveBeenCalledTimes(2);
  });
});
