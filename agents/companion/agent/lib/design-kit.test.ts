import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DESIGN_KIT_FILES, DESIGN_TOKENS, THEME_CSS } from "./design-kit";

const globals = readFileSync(
  join(import.meta.dirname, "../../../../apps/web/app/globals.css"),
  "utf8",
);

/** `--name: value;` declarations in the first block after `marker`. */
function tokensAfter(marker: string): Record<string, string> {
  const start = globals.indexOf(marker);
  const block = globals.slice(start, globals.indexOf("}", start));
  return Object.fromEntries(
    [...block.matchAll(/--([a-z-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value]),
  );
}

describe("design kit", () => {
  it("has the web app's light tokens", () => {
    expect(DESIGN_TOKENS.light).toEqual(tokensAfter(":root {"));
  });

  it("has the web app's dark tokens", () => {
    expect(DESIGN_TOKENS.dark).toEqual(tokensAfter("@media (prefers-color-scheme: dark)"));
  });

  it("maps every color token into the Tailwind theme, in light and dark", () => {
    for (const name of Object.keys(DESIGN_TOKENS.dark)) {
      expect(THEME_CSS).toContain(`--color-${name}: var(--${name});`);
      expect(THEME_CSS).toContain(`--${name}: ${DESIGN_TOKENS.dark[name as "ring"]};`);
    }
  });

  it("writes the kit under design/", () => {
    expect(Object.keys(DESIGN_KIT_FILES).sort()).toEqual([
      "design/README.md",
      "design/components.md",
      "design/template.html",
      "design/theme.css",
    ]);
    expect(DESIGN_KIT_FILES["design/theme.css"]).toBe(THEME_CSS);
  });
});
