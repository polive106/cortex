# ADR-0013: Session index in Upstash Redis

## Status

Accepted

## Context

The web UI should show a sidebar of the signed-in user's earlier sessions, which they can reopen, rename, or delete. eve keeps every session and can reopen one from its ID (`/s/<id>` already does), but its session API has no route that lists sessions. The list has to live somewhere we own.

A list per browser in `localStorage` wouldn't follow the user to another device, and it would never include sessions that other channels start, such as Slack (E4). The brain repo is no place for it either: a commit for every turn would fill its history with noise, and the brain is shared knowledge, not per-user state.

eve hooks (`agent/hooks/*.ts`) see every session's events, including `delivery.consumed` (a message's parts) and `turn.settled`, along with the session's auth (`ctx.session.auth.initiator`). That makes them the natural place to record activity. A `defineChannel` route can end a session with `attachSession(id).end()`.

## Decision

- A **`SessionIndex` port** in `@cortex/domain` (`packages/domain/src/sessions/`) holds one `SessionSummary` per session: `sessionId`, `owner` (the initiator's `principalId`), `title`, `createdAt`, and `updatedAt`. Every call is scoped by `owner`, so one user can never read or change another user's entries.
- The **adapter is `UpstashSessionIndex`**, which calls the Upstash Redis REST API with `fetch` (no SDK). Layout: a hash `cortex:session:<owner>:<sessionId>` (fields `title`, `createdAt`, `updatedAt`) and a sorted set `cortex:sessions:<owner>` scored by `updatedAt`. Recording activity sets the title with `HSETNX`, so a turn never overwrites a rename. The in-memory twin, `InMemorySessionIndex`, passes the same contract tests.
- **Configuration**: `KV_REST_API_URL` and `KV_REST_API_TOKEN`, which the Vercel Marketplace Upstash integration writes when connected with the `KV` prefix. Upstash's own names, `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, also work and take precedence. They are read only in `container.ts`. Without them, or with `SESSIONS_STORE=memory` (set by evals and E2E), the index is in memory.
- A **global hook** (`agents/companion/agent/hooks/session-index.ts`) records activity for web channel sessions on `delivery.consumed`. The first user message's text becomes the title.
- The **companion route** `/sessions` (mounted at `/eve/<agent>/sessions` like `/artifacts`, behind `WEB_AUTH`) handles `GET` (list, recent first), `PATCH ?id=` with `{ title }` (rename), and `DELETE ?id=` (end the eve session, then remove the entry). It uses query parameters rather than path segments, so `vercel.ts` mounts one fixed path.
- The web feature `apps/web/src/features/sessions/` shows the list. Entries idle for longer than the session timeout (30 days by default) are marked expired, since eve may have deleted their history.

## Consequences

### Positive
- The list follows the user across devices and can include Slack sessions once E4 lands.
- Upstash's REST API is plain HTTP, so the adapter is tested with msw like the GitHub one, and nothing new ends up in the bundle.
- Titles survive concurrent turns and renames, because only `HSETNX` sets a title on the activity path.

### Negative
- A new external service and two secrets to provision, on top of the GitHub token and the Anthropic key.
- The index can drift from eve: a session can end on eve's side (timeout, retention) while its entry stays. The sidebar marks such entries expired instead of probing eve for each one.
- Without Upstash configured, hosted builds fall back to the in-memory index, which forgets entries whenever an instance restarts.

## Alternatives Considered
- **`localStorage` in the browser**: one device only, and never sees other channels' sessions.
- **Neon Postgres**: SQL and room to grow, but a schema, migrations, and a heavier client for what is a sorted list per user.
- **Vercel Blob (one JSON file per user)**: concurrent turns overwrite each other's writes, and listing is slow.
- **The brain repo**: one commit per turn pollutes a shared knowledge base with per-user state.
