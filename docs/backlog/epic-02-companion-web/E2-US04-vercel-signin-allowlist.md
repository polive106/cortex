# E2-US04: Vercel sign-in and email allowlist

**User Story**: As the owner, I want only my account to reach the web UI and the agent so that nobody else can spend my tokens or read my brain.

**Acceptance Criteria**:
- [x] Sign in with Vercel through better-auth, stateless (JWE cookie session, no database), following eve's `web-sign-in-with-vercel` registry item
- [x] `ALLOWED_EMAILS` (comma-separated) is enforced in **both** places:
  - [x] the web app (signed-in users not on the list get a "not allowed" screen)
  - [x] the agent's `channels/eve.ts` auth function (returns null for them)
- [x] The allowlist check is a pure function with unit tests: case-insensitive, trims whitespace, empty list denies all
- [x] Production requires `BETTER_AUTH_SECRET`, `VERCEL_APP_CLIENT_ID`, `VERCEL_APP_CLIENT_SECRET`, `ALLOWED_EMAILS`, and fails closed if any is missing
- [x] `localDev()` still works for `eve dev` and evals

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Domain | `isAllowedEmail(email, allowlist)`, `parseAllowlist(raw)` | `packages/domain/src/auth/is-allowed-email.ts` |
| Agent | Channel auth with the allowlist | `agents/companion/agent/channels/eve.ts` |
| Web | better-auth config, sign-in slice | `apps/web/src/lib/auth.ts`, `apps/web/src/features/auth-gate/**` |
| E2E | Signed-out and not-allowed flows | `e2e/tests/auth/*.spec.ts` |

**Dependencies**: E2-US03

**Complexity**: M

**Status**: Done

**Note (2026-11-14)**: the Playwright flows in `e2e/tests/auth/` move to E2-US05, which sets up Playwright. Verified by hand on production: `/` shows the sign-in screen, and an anonymous `POST /eve/companion/v1/session` returns 401. `lib/auth.ts` throws on missing auth secrets, and a missing `ALLOWED_EMAILS` denies everyone.

**Test Scenarios**:
```gherkin
Scenario: Allowed user
  Given my email is in ALLOWED_EMAILS
  When I sign in with Vercel
  Then I see the chat screen

Scenario: Other Vercel user
  Given an email not in ALLOWED_EMAILS
  When they sign in
  Then they see "not allowed" and agent calls return 401

Scenario: Anonymous API call
  When POST /eve/companion/v1/session is sent without a session cookie or OIDC token
  Then it is rejected
```
