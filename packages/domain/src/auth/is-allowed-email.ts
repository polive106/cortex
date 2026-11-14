const normalize = (email: string): string => email.trim().toLowerCase();

/** Parses a comma-separated `ALLOWED_EMAILS` value. Missing or blank means nobody is allowed. */
export function parseAllowlist(raw: string | undefined): string[] {
  return (raw ?? "").split(",").map(normalize).filter(Boolean);
}

/** Fails closed: a missing email or an empty allowlist denies access. */
export function isAllowedEmail(
  email: string | null | undefined,
  allowlist: readonly string[],
): boolean {
  // parseAllowlist drops blanks, so a blank email can never match.
  return email != null && allowlist.includes(normalize(email));
}
