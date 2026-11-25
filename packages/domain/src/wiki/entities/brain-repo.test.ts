import { describe, expect, it } from "vitest";
import { parseBrainRepo } from "./brain-repo";

describe("parseBrainRepo", () => {
  it("reads owner/repo, with main as the default branch", () => {
    expect(parseBrainRepo("acme/brain")).toEqual({
      owner: "acme",
      name: "brain",
      branch: "main",
    });
    expect(parseBrainRepo("acme/wiki.v2", "release/1")).toEqual({
      owner: "acme",
      name: "wiki.v2",
      branch: "release/1",
    });
    expect(parseBrainRepo("a/b", "")).toMatchObject({ branch: "main" });
  });

  it.each(["", "brain", "a/b/c", "/b", "a/", "a b/c", "a/b?x"])("refuses %j", (repo) => {
    expect(parseBrainRepo(repo)).toBeUndefined();
  });
});
