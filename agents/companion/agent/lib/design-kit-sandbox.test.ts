import { describe, expect, it } from "vitest";
import { DESIGN_KIT_FILES } from "./design-kit";
import { withDesignKit } from "./design-kit-sandbox";

describe("withDesignKit", () => {
  it("writes every kit file and hands back the same sandbox", async () => {
    const files: Record<string, string> = {};
    const sandbox = {
      async writeTextFile({ path, content }: { path: string; content: string }) {
        files[path] = content;
      },
    };
    await expect(withDesignKit(sandbox)).resolves.toBe(sandbox);
    expect(files).toEqual(DESIGN_KIT_FILES);
  });
});
