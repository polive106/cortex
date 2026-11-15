import { describe, expect, it } from "vitest";
import { InvalidPathError } from "../../wiki/errors";
import { ArtifactPath, isArtifactPath } from "./artifact-path";

describe("ArtifactPath", () => {
  it("accepts an HTML file directly under out/", () => {
    const path = ArtifactPath.parse("out/roadmap.html");
    expect(path.value).toBe("out/roadmap.html");
    expect(path.slug).toBe("roadmap");
    expect(path.project).toBeUndefined();
  });

  it("accepts one project folder", () => {
    const path = ArtifactPath.parse("out/acme/q3-review.html");
    expect(path.slug).toBe("q3-review");
    expect(path.project).toBe("acme");
  });

  it("builds a path from a slug and an optional project", () => {
    expect(ArtifactPath.of("roadmap").value).toBe("out/roadmap.html");
    expect(ArtifactPath.of("roadmap", "acme").value).toBe("out/acme/roadmap.html");
  });

  it.each([
    ["outside out/", "wiki/roadmap.html"],
    ["not HTML", "out/roadmap.md"],
    ["nested twice", "out/a/b/c.html"],
    ["parent traversal", "out/../AGENTS.html"],
    ["absolute", "/out/roadmap.html"],
    ["uppercase", "out/Roadmap.html"],
    ["empty slug", "out/.html"],
  ])("rejects a path %s", (_reason, input) => {
    expect(() => ArtifactPath.parse(input)).toThrow(InvalidPathError);
  });

  it("rejects a slug or project that isn't kebab-case", () => {
    expect(() => ArtifactPath.of("My Page")).toThrow(InvalidPathError);
    expect(() => ArtifactPath.of("page", "../wiki")).toThrow(InvalidPathError);
  });

  it("tells stored artifacts from other files", () => {
    expect(isArtifactPath("out/a/b.html")).toBe(true);
    expect(isArtifactPath("out/a.md")).toBe(false);
    expect(isArtifactPath("wiki/a.html")).toBe(false);
  });
});
