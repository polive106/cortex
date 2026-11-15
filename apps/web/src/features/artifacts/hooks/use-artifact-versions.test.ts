import { act, renderHook } from "@testing-library/react";
import type { EveMessage } from "eve/react";
import { describe, expect, it } from "vitest";
import { useArtifactVersions } from "./use-artifact-versions";

const publish = (callId: string, version: number) =>
  ({
    id: `m-${callId}`,
    role: "assistant",
    metadata: {},
    parts: [
      {
        type: "tool",
        callId,
        name: "publish_artifact",
        state: "completed",
        output: { published: true, path: "out/a.html", title: "A", version, ref: `r${version}` },
      },
    ],
  }) as unknown as EveMessage;

describe("useArtifactVersions", () => {
  it("stays closed with nothing to show", () => {
    const { result } = renderHook(() => useArtifactVersions([]));
    expect(result.current).toMatchObject({ versions: [], selected: undefined, open: false });
  });

  it("opens on each new version and follows it", () => {
    const { result, rerender } = renderHook(({ messages }) => useArtifactVersions(messages), {
      initialProps: { messages: [publish("c1", 1)] },
    });
    expect(result.current).toMatchObject({ open: true, selected: { id: "c1" } });

    act(() => result.current.hide());
    expect(result.current.open).toBe(false);

    rerender({ messages: [publish("c1", 1), publish("c2", 2)] });
    expect(result.current).toMatchObject({ open: true, selected: { id: "c2", version: 2 } });
  });

  it("keeps an earlier version selected until a newer one arrives", () => {
    const messages = [publish("c1", 1), publish("c2", 2)];
    const { result, rerender } = renderHook(({ messages }) => useArtifactVersions(messages), {
      initialProps: { messages },
    });
    act(() => result.current.select("c1"));
    expect(result.current.selected?.id).toBe("c1");

    rerender({ messages: [...messages] });
    expect(result.current.selected?.id).toBe("c1");

    act(() => result.current.select("unknown"));
    expect(result.current.selected?.id).toBe("c2");
  });

  it("reopens on demand", () => {
    const { result } = renderHook(() => useArtifactVersions([publish("c1", 1)]));
    act(() => result.current.hide());
    act(() => result.current.show());
    expect(result.current.open).toBe(true);
  });
});
