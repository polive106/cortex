import { act, cleanup, renderHook } from "@testing-library/react";
import type { EveMessage } from "eve/react";
import { afterEach, describe, expect, it } from "vitest";
import { useBrainTrail } from "./use-brain-trail";

afterEach(cleanup);

const call = (callId: string, name: string, input: unknown, output: unknown) =>
  ({
    id: callId,
    role: "assistant",
    parts: [
      {
        type: "tool",
        callId,
        stepIndex: 0,
        kind: "tool",
        name,
        label: name,
        state: "completed",
        input,
        output,
      },
    ],
  }) as unknown as EveMessage;

const read = (callId: string, path: string) => call(callId, "read_page", { path }, { path });
const write = (callId: string, path: string) =>
  call(callId, "write_page", {}, { committed: true, changes: [`create ${path}`], ref: "sha-2" });
const text = { id: "t", role: "assistant", parts: [{ type: "text", text: "…" }] } as EveMessage;

const none: EveMessage[] = [];

describe("useBrainTrail", () => {
  it("stays closed with no brain use", () => {
    const { result } = renderHook(() => useBrainTrail(none));
    expect(result.current).toMatchObject({ steps: [], written: undefined, open: false });
  });

  it("opens on the first step, stays closed once hidden, and reopens on show", () => {
    const { result, rerender } = renderHook(({ messages }) => useBrainTrail(messages), {
      initialProps: { messages: none },
    });
    rerender({ messages: [read("c1", "wiki/a.md")] });
    expect(result.current.open).toBe(true);
    expect(result.current.steps.map((step) => step.path)).toEqual(["wiki/a.md"]);

    act(() => result.current.hide());
    rerender({ messages: [read("c1", "wiki/a.md"), write("c2", "wiki/b.md")] });
    expect(result.current.open).toBe(false);
    expect(result.current.written).toBe("sha-2");

    act(() => result.current.show());
    expect(result.current.open).toBe(true);
  });

  it("keeps the same steps while the conversation changes without moving", () => {
    const { result, rerender } = renderHook(({ messages }) => useBrainTrail(messages), {
      initialProps: { messages: [read("c1", "wiki/a.md")] },
    });
    const steps = result.current.steps;
    rerender({ messages: [read("c1", "wiki/a.md"), text] });
    expect(result.current.steps).toBe(steps);
  });

  it("opens again for each page someone asks to read", () => {
    const { result, rerender } = renderHook(
      ({ request }: { request?: { path: string; id: number } }) => useBrainTrail(none, request),
      { initialProps: {} as { request?: { path: string; id: number } } },
    );
    expect(result.current.open).toBe(false);
    rerender({ request: { path: "wiki/a.md", id: 1 } });
    expect(result.current.open).toBe(true);
    act(() => result.current.hide());
    rerender({ request: { path: "wiki/a.md", id: 2 } });
    expect(result.current.open).toBe(true);
  });
});
