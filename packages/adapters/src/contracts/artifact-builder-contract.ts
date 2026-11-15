import type { ArtifactBuilder } from "@cortex/domain";
import { describe, expect, it } from "vitest";

/** Behavior every ArtifactBuilder shares (ADR-0002), so the twin can stand in for Tailwind. */
export function describeArtifactBuilderContract(name: string, make: () => ArtifactBuilder) {
  describe(`${name} (ArtifactBuilder contract)`, () => {
    const html = '<div class="p-4 bg-primary text-sm">Hi</div>';

    it("returns CSS for a page", async () => {
      await expect(make().css(html)).resolves.toEqual(expect.any(String));
    });

    it("is deterministic and independent of earlier builds", async () => {
      const builder = make();
      const first = await builder.css(html);
      await builder.css('<p class="m-8 text-destructive">other</p>');
      await expect(builder.css(html)).resolves.toBe(first);
    });

    it("builds an empty page", async () => {
      await expect(make().css("")).resolves.toEqual(expect.any(String));
    });
  });
}
