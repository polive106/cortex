import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAttachmentError } from "./use-attachment-error";

describe("useAttachmentError", () => {
  it("explains a refused file until it is dismissed", () => {
    const { result } = renderHook(() => useAttachmentError());
    expect(result.current.message).toBeUndefined();
    act(() => result.current.report({ code: "max_file_size", message: "All files exceed" }));
    expect(result.current.message).toBe(
      "Files must be 3 MB or less. Split the PDF, or paste its text.",
    );
    act(() => result.current.dismiss());
    expect(result.current.message).toBeUndefined();
  });

  it("keeps stable callbacks across renders", () => {
    const { result, rerender } = renderHook(() => useAttachmentError());
    const { report, dismiss } = result.current;
    rerender();
    expect(result.current.report).toBe(report);
    expect(result.current.dismiss).toBe(dismiss);
  });
});
