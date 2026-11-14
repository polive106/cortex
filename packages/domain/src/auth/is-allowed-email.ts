const normalize = (email: string): string => email.trim().toLowerCase();

/** Parses a comma-separated `ALLOWED_EMAILS` value. Missing or blank means nobody is allowed. */
export function parseAllowlist(raw: string | undefined): string[] {
  return (raw ?? "").split(",").map(normalize).filter(Boolean);
}

/** An identity the sign-in provider vouches for. */
export interface SignedInUser {
  readonly email: string;
  readonly emailVerified: boolean;
}

/** Fails closed: only a verified email on a non-empty allowlist gets in. */
export function isAllowedUser(user: SignedInUser, allowlist: readonly string[]): boolean {
  // parseAllowlist drops blanks, so a blank email can never match.
  return user.emailVerified && allowlist.includes(normalize(user.email));
}
