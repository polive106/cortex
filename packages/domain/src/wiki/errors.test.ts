import { describe, expect, it } from "vitest";
import {
  ConflictError,
  InvalidPathError,
  PageNotFoundError,
  SourceFetchError,
  WikiError,
} from "./errors";

describe("wiki errors", () => {
  it.each([
    [
      new InvalidPathError("raw/x", "must live under wiki/"),
      "InvalidPathError",
      'Invalid path "raw/x": must live under wiki/',
    ],
    [new PageNotFoundError("wiki/a.md"), "PageNotFoundError", "No page at wiki/a.md"],
    [
      new SourceFetchError("https://x.test", "HTTP 500"),
      "SourceFetchError",
      "Could not fetch https://x.test: HTTP 500",
    ],
    [new ConflictError("raw/a.md already exists"), "ConflictError", "raw/a.md already exists"],
  ])("%s has a stable name and a model-readable message", (error, name, message) => {
    expect(error).toBeInstanceOf(WikiError);
    expect(error.name).toBe(name);
    expect(error.message).toBe(message);
  });

  it("keeps the offending path for callers", () => {
    expect(new InvalidPathError("raw/x", "r").path).toBe("raw/x");
    expect(new PageNotFoundError("wiki/a.md").path).toBe("wiki/a.md");
  });
});
