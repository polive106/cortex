import { describe, expect, it } from "vitest";
import { approvalDetails } from "./approval-summary";

describe("approvalDetails", () => {
  it("lists scalar inputs as key: value", () => {
    expect(
      approvalDetails({ callId: "c1", name: "write_page", input: { path: "wiki/a.md", n: 2 } }),
    ).toEqual(["path: wiki/a.md", "n: 2"]);
  });

  it("shows nested values as compact JSON and truncates long values", () => {
    const details = approvalDetails({
      callId: "c1",
      name: "t",
      input: { tags: ["a", "b"], body: "x".repeat(200) },
    });
    expect(details[0]).toBe('tags: ["a","b"]');
    expect(details[1]).toHaveLength("body: ".length + 120);
    expect(details[1]?.endsWith("…")).toBe(true);
  });

  it("is empty without an object input or a call", () => {
    expect(approvalDetails({ callId: "c1", name: "t" })).toEqual([]);
    expect(approvalDetails({ callId: "c1", name: "t", input: "raw" })).toEqual([]);
    expect(approvalDetails(undefined)).toEqual([]);
  });
});
