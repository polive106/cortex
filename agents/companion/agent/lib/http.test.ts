import { describe, expect, it } from "vitest";
import { failure, json } from "./http";

describe("json and failure", () => {
  it("answer uncached JSON", async () => {
    const ok = json({ a: 1 });
    expect(ok.status).toBe(200);
    expect(ok.headers.get("cache-control")).toBe("no-store");
    const refused = failure(404, "No such thing");
    expect(refused.status).toBe(404);
    expect(refused.headers.get("cache-control")).toBe("no-store");
    await expect(refused.json()).resolves.toEqual({ ok: false, error: "No such thing" });
  });

  it("let a route set its own headers", () => {
    const tagged = json({}, 200, { etag: '"a"', "cache-control": "private, no-cache" });
    expect(tagged.headers.get("etag")).toBe('"a"');
    expect(tagged.headers.get("cache-control")).toBe("private, no-cache");
  });
});
