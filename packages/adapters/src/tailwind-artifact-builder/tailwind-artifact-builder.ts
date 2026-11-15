import type { ArtifactBuilder } from "@cortex/domain";
import { TAILWIND_BASE_CSS } from "./tailwind-base.generated";

/** Splits a page into candidate class names; Tailwind ignores the ones that aren't classes. */
const candidates = (html: string) => html.split(/[\s"'`]+/).filter(Boolean);

/**
 * Compiles the Tailwind classes a page uses on the design kit's theme (ADR-0012), with Tailwind
 * v4's JS compiler, so it works anywhere the server runs: no CLI, no native code, no network.
 * Each page gets a fresh compiler, because a compiler keeps every class it has ever built.
 */
export class TailwindArtifactBuilder implements ArtifactBuilder {
  /** `theme` is CSS appended after `@import "tailwindcss"`: tokens, `@theme`, base styles. */
  constructor(private readonly theme: string) {}

  async css(html: string): Promise<string> {
    const { compile } = await import("tailwindcss");
    const compiler = await compile(`@import "tailwindcss";\n${this.theme}`, {
      base: "/",
      async loadStylesheet(id) {
        if (id !== "tailwindcss") throw new Error(`Only tailwindcss can be imported, not ${id}`);
        return { path: "tailwindcss/index.css", base: "/", content: TAILWIND_BASE_CSS };
      },
    });
    return compiler.build(candidates(html));
  }
}
