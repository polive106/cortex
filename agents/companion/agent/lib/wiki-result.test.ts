import { PageNotFoundError } from "@cortex/domain";
import { describe, expect, it } from "vitest";
import { wikiResult } from "./wiki-result";

describe("wikiResult", () => {
  it("passes results through", async () => {
    await expect(wikiResult(async () => ({ ok: 1 }))).resolves.toEqual({ ok: 1 });
  });

  it("turns domain errors into a model-readable error result", async () => {
    await expect(
      wikiResult(async () => {
        throw new PageNotFoundError("wiki/x.md");
      }),
    ).resolves.toEqual({ error: "PageNotFoundError", message: "No page at wiki/x.md" });
  });

  it("rethrows anything else so it fails the call instead of leaking details", async () => {
    await expect(
      wikiResult(async () => {
        throw new Error("GitHub GET /contents failed: 500");
      }),
    ).rejects.toThrow(/500/);
  });
});
