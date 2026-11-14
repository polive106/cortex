import { describe, expect, it } from "vitest";
import { isAllowedUser, parseAllowlist } from "./is-allowed-email";

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

describe("isAllowedUser", () => {
  const allowlist = parseAllowlist("ana@example.com,bob@example.com");
  const verified = (email: string) => ({ email, emailVerified: true });

  it("allows a verified, listed email, ignoring case and surrounding whitespace", () => {
    expect(isAllowedUser(verified("  ANA@example.COM "), allowlist)).toBe(true);
  });

  it("denies a listed email that is not verified", () => {
    expect(isAllowedUser({ email: "ana@example.com", emailVerified: false }, allowlist)).toBe(
      false,
    );
  });

  it("denies a verified email that is not listed", () => {
    expect(isAllowedUser(verified("eve@example.com"), allowlist)).toBe(false);
  });

  it("denies everyone when the allowlist is empty", () => {
    expect(isAllowedUser(verified("ana@example.com"), [])).toBe(false);
  });

  it("denies a blank email", () => {
    expect(isAllowedUser(verified("  "), allowlist)).toBe(false);
  });
});
