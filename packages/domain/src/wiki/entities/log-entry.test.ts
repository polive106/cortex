import { describe, expect, it } from "vitest";
import { LogEntry } from "./log-entry";

describe("LogEntry", () => {
  it("formats the brain's log heading and lists what changed", () => {
    const entry = new LogEntry({
      date: "2026-11-14",
      operation: "ingest",
      title: "Deploy notes",
      details: ["source raw/2026-11-14-deploy-notes.md", "created wiki/deploys.md"],
    });
    expect(entry.format()).toBe(
      "## [2026-11-14] ingest | Deploy notes\n\n- source raw/2026-11-14-deploy-notes.md\n- created wiki/deploys.md\n",
    );
  });

  it("appends after existing log content with one blank line between", () => {
    const entry = new LogEntry({ date: "2026-11-14", operation: "lint", title: "T", details: [] });
    expect(entry.appendTo("# Log\n")).toBe("# Log\n\n## [2026-11-14] lint | T\n");
    expect(entry.appendTo("")).toBe("## [2026-11-14] lint | T\n");
    expect(entry.appendTo("# Log")).toBe("# Log\n\n## [2026-11-14] lint | T\n");
  });

  it("flattens newlines in the title", () => {
    expect(
      new LogEntry({ date: "d", operation: "query", title: "a\nb", details: [] }).format(),
    ).toBe("## [d] query | a b\n");
  });
});
