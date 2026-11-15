import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { describeArtifactBuilderContract } from "../contracts/artifact-builder-contract";
import { TailwindArtifactBuilder } from "./tailwind-artifact-builder";
import { TAILWIND_BASE_CSS, TAILWIND_VERSION } from "./tailwind-base.generated";

const THEME = `@theme inline { --color-primary: var(--primary); }
:root { --primary: oklch(0.2 0 0); }`;

describeArtifactBuilderContract(
  "TailwindArtifactBuilder",
  () => new TailwindArtifactBuilder(THEME),
);

describe("TailwindArtifactBuilder", () => {
  const build = (html: string) => new TailwindArtifactBuilder(THEME).css(html);

  it("compiles the classes the page uses on the theme, with Tailwind's preflight", async () => {
    const css = await build('<div class="bg-primary p-4 hover:bg-primary/90 md:grid-cols-3">');
    expect(css).toContain(".bg-primary");
    expect(css).toContain("background-color: var(--primary)");
    expect(css).toContain(".p-4");
    expect(css).toContain(".md\\:grid-cols-3");
    expect(css).toContain("--primary: oklch(0.2 0 0)");
    expect(css).toContain("box-sizing: border-box"); // preflight
  });

  it("leaves out classes the page doesn't use", async () => {
    const css = await build('<div class="p-4">');
    expect(css).not.toContain(".m-8");
    expect(css).not.toContain(".bg-primary");
  });

  it("handles arbitrary values and variants with brackets", async () => {
    const css = await build("<button class='has-[>svg]:px-3 [&_svg]:size-4 w-[37px]'>");
    expect(css).toContain("37px");
    expect(css).toContain(":has(>svg)");
  });

  it("ignores tokens that aren't classes", async () => {
    await expect(build('<p data-x="not-a-class zz-nope">text</p>')).resolves.not.toContain(
      "zz-nope",
    );
  });

  it("refuses imports other than tailwindcss", async () => {
    const builder = new TailwindArtifactBuilder('@import "./other.css";');
    await expect(builder.css("<p>")).rejects.toThrow(/Only tailwindcss can be imported/);
  });

  it("embeds the installed tailwindcss base CSS (run `pnpm sync:tailwind` after upgrading)", async () => {
    const require = createRequire(import.meta.url);
    const root = join(dirname(require.resolve("tailwindcss")), "..");
    const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
    expect(TAILWIND_VERSION).toBe(pkg.version);
    expect(TAILWIND_BASE_CSS).toBe(await readFile(join(root, "index.css"), "utf8"));
  });
});
