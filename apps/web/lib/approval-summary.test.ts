import { describe, expect, it } from "vitest";
import { approvalDetails } from "./approval-summary";

describe("approvalDetails", () => {
  it("lists scalar inputs as key and value, in full", () => {
    expect(
      approvalDetails({ callId: "c1", name: "write_page", input: { path: "wiki/a.md", n: 2 } }),
    ).toEqual([
      { key: "path", preview: "wiki/a.md", full: "wiki/a.md", truncated: false },
      { key: "n", preview: "2", full: "2", truncated: false },
    ]);
  });

  it("shows nested values as JSON and keeps the full text when the preview is cut", () => {
    const body = "x".repeat(200);
    const [tags, long] = approvalDetails({
      callId: "c1",
      name: "t",
      input: { tags: ["a", "b"], body },
    });
    expect(tags).toMatchObject({ preview: '["a","b"]', truncated: false });
    expect(long?.preview).toHaveLength(120);
    expect(long?.preview.endsWith("…")).toBe(true);
    expect(long).toMatchObject({ full: body, truncated: true });
  });

  it("pretty-prints nested values in full, so the approver sees every page body", () => {
    const [pages] = approvalDetails({
      callId: "c1",
      name: "write_page",
      input: { pages: [{ title: "T", body: "line 1\nline 2" }] },
    });
    expect(pages?.full).toBe(JSON.stringify([{ title: "T", body: "line 1\nline 2" }], null, 2));
  });

  it("is empty without an object input or a call", () => {
    expect(approvalDetails({ callId: "c1", name: "t" })).toEqual([]);
    expect(approvalDetails({ callId: "c1", name: "t", input: "raw" })).toEqual([]);
    expect(approvalDetails(undefined)).toEqual([]);
  });
});
