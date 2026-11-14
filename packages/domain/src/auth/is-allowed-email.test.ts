import { describe, expect, it } from "vitest";
import { isAllowedEmail, parseAllowlist } from "./is-allowed-email";

describe("parseAllowlist", () => {
  it("splits a comma-separated list, trims, lowercases, and drops blanks", () => {
    expect(parseAllowlist(" Ana@Example.com, ,bob@example.com ,")).toEqual([
      "ana@example.com",
      "bob@example.com",
    ]);
  });

  it("returns an empty list when the value is missing or blank", () => {
    expect(parseAllowlist(undefined)).toEqual([]);
    expect(parseAllowlist("   ")).toEqual([]);
  });
});

describe("isAllowedEmail", () => {
  const allowlist = parseAllowlist("ana@example.com,bob@example.com");

  it("allows a listed email, ignoring case and surrounding whitespace", () => {
    expect(isAllowedEmail("  ANA@example.COM ", allowlist)).toBe(true);
  });

  it("denies an email that is not listed", () => {
    expect(isAllowedEmail("eve@example.com", allowlist)).toBe(false);
  });

  it("denies everyone when the allowlist is empty", () => {
    expect(isAllowedEmail("ana@example.com", [])).toBe(false);
  });

  it("denies a missing or blank email", () => {
    expect(isAllowedEmail(undefined, allowlist)).toBe(false);
    expect(isAllowedEmail(null, allowlist)).toBe(false);
    expect(isAllowedEmail("  ", allowlist)).toBe(false);
  });
});
