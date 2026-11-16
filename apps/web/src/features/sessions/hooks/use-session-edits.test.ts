import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useSessionEdits } from "./use-session-edits";

describe("useSessionEdits", () => {
  it("edits one row at a time: renaming or confirming a delete", () => {
    const { result } = renderHook(() => useSessionEdits());
    expect(result.current).toMatchObject({ renaming: undefined, confirming: undefined });
    act(() => result.current.startRename("s1"));
    expect(result.current).toMatchObject({ renaming: "s1", confirming: undefined });
    act(() => result.current.startDelete("s2"));
    expect(result.current).toMatchObject({ renaming: undefined, confirming: "s2" });
    act(() => result.current.cancel());
    expect(result.current).toMatchObject({ renaming: undefined, confirming: undefined });
  });
});
