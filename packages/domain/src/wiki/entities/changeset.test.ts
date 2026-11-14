import { describe, expect, it } from "vitest";
import { Changeset } from "./changeset";

describe("Changeset", () => {
  it("keeps writes in insertion order", () => {
    const changeset = new Changeset().write("raw/a.md", "1").write("wiki/a.md", "2");
    expect(changeset.files).toEqual([
      { path: "raw/a.md", content: "1", mustNotExist: false },
      { path: "wiki/a.md", content: "2", mustNotExist: false },
    ]);
    expect(changeset.paths).toEqual(["raw/a.md", "wiki/a.md"]);
  });

  it("carries a must-not-exist precondition for the store to enforce", () => {
    const changeset = new Changeset().write("raw/a.md", "1", { mustNotExist: true });
    expect(changeset.files[0]?.mustNotExist).toBe(true);
  });

  it("refuses two writes to the same path", () => {
    expect(() => new Changeset().write("a", "1").write("a", "2")).toThrow(/twice/);
  });

  it("knows when it's empty, so stores can refuse to commit nothing", () => {
    expect(new Changeset().isEmpty).toBe(true);
    expect(new Changeset().write("a", "1").isEmpty).toBe(false);
  });
});
