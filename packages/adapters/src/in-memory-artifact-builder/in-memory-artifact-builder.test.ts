import { describe, expect, it } from "vitest";
import { describeArtifactBuilderContract } from "../contracts/artifact-builder-contract";
import { InMemoryArtifactBuilder } from "./in-memory-artifact-builder";

describeArtifactBuilderContract("InMemoryArtifactBuilder", () => new InMemoryArtifactBuilder());

describe("InMemoryArtifactBuilder", () => {
  it("returns its fixed CSS and records each page", async () => {
    const builder = new InMemoryArtifactBuilder(".x{}");
    await expect(builder.css("<p>a</p>")).resolves.toBe(".x{}");
    expect(builder.built).toEqual(["<p>a</p>"]);
  });
});
