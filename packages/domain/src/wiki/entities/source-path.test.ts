import { describe, expect, it } from "vitest";
import { InvalidPathError } from "../errors";
import { SourcePath } from "./source-path";

describe("SourcePath", () => {
  it("accepts raw/YYYY-MM-DD-<slug>.md", () => {
    expect(SourcePath.parse("raw/2026-11-14-deploy-notes.md").value).toBe(
      "raw/2026-11-14-deploy-notes.md",
    );
  });

  it("builds a dated path from a title, in UTC", () => {
    const date = new Date("2026-11-14T23:30:00Z");
    expect(SourcePath.forTitle(date, "Deploy notes: v2").value).toBe(
      "raw/2026-11-14-deploy-notes-v2.md",
    );
  });

  it("numbers later sources with the same title and day", () => {
    const date = new Date("2026-11-14T00:00:00Z");
    expect(SourcePath.forTitle(date, "Deploy notes", 1).value).toBe(
      "raw/2026-11-14-deploy-notes.md",
    );
    expect(SourcePath.forTitle(date, "Deploy notes", 3).value).toBe(
      "raw/2026-11-14-deploy-notes-3.md",
    );
  });

  it.each([
    ["outside raw/", "wiki/2026-11-14-a.md"],
    ["no date", "raw/notes.md"],
    ["bad date", "raw/2026-13-40-a.md"],
    ["traversal", "raw/../2026-11-14-a.md"],
    ["nested", "raw/x/2026-11-14-a.md"],
    ["uppercase", "raw/2026-11-14-Notes.md"],
  ])("rejects a path %s", (_reason, input) => {
    expect(() => SourcePath.parse(input)).toThrow(InvalidPathError);
  });

  it("rejects a title with no usable characters", () => {
    expect(() => SourcePath.forTitle(new Date("2026-11-14T00:00:00Z"), "!!!")).toThrow(
      InvalidPathError,
    );
  });
});
