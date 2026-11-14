# ADR-0006: Web authentication: Sign in with Vercel + email allowlist

## Status

Accepted (2026-11-14)

## Context

The deployed web UI calls the agent with a paid Anthropic key, so it must not be open. For now it is used only by its owner. Vercel deployment protection may not cover production URLs on the Hobby plan.

## Decision

Use eve's `web-sign-in-with-vercel` pattern: **better-auth with the Vercel social provider**, **stateless sessions** (encrypted JWE cookie, 8-hour lifetime, no database).

Because any Vercel user could otherwise sign in, enforce an **`ALLOWED_EMAILS` allowlist** in *both*:
1. the web app (session check), and
2. the agent's `agent/channels/eve.ts` auth function, so the agent routes are protected even when called directly.

`vercelOidc()` stays enabled for Vercel-internal calls, and `localDev()` for `eve dev`.

Env vars: `VERCEL_APP_CLIENT_ID`, `VERCEL_APP_CLIENT_SECRET`, `BETTER_AUTH_SECRET`, `ALLOWED_EMAILS`.

## Consequences

### Positive
- No shared password, and the agent gets a real principal ID per caller, which per-user memory and auditing need later.
- No database to run.

### Negative
- Requires creating a Vercel OAuth app.
- Revoking a session before it expires means rotating `BETTER_AUTH_SECRET`.

## Alternatives Considered
- **Shared password gate**: simpler, but no identity.
- **Vercel deployment protection**: may not cover production on Hobby.
- **No auth**: anyone could spend the API budget.
