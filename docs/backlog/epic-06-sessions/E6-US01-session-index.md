# E6-US01: Session index domain and adapters

**User Story**: As a user, I want companion to remember which sessions I've had so that I can find them again from any device.

**Acceptance Criteria**:

- [x] `SessionIndex` port and `SessionSummary` entity in `@cortex/domain`, every call scoped by owner (ADR-0013)
- [x] `SessionTitle` turns a first message into a title: whitespace collapsed, at most 80 characters, "New chat" when empty
- [x] Use-cases `RecordSessionActivity`, `ListSessions`, `RenameSession`, `RemoveSession`; rename and remove raise `SessionNotFoundError` for another owner's or a missing session
- [x] Recording keeps an existing title (a rename is never overwritten) and bumps `updatedAt`
- [x] `InMemorySessionIndex` and `UpstashSessionIndex` pass one contract suite; Upstash is tested with msw and its token never appears in errors
- [x] `container.ts` picks Upstash when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (or the Marketplace's `KV_REST_API_URL` and `KV_REST_API_TOKEN`) are set, unless `SESSIONS_STORE=memory`

**Technical Tasks**:

| Layer    | Task | File(s)                      |
| -------- | ---- | ---------------------------- |
| Domain   | Entity, title, errors, port, use-cases | `packages/domain/src/sessions/` |
| Adapters | In-memory twin, Upstash REST adapter, contract, fake Upstash | `packages/adapters/src/{in-memory-session-index,upstash-session-index,contracts,testing}/` |
| Agent    | Wire the index | `agents/companion/agent/container.ts` |

**Dependencies**: None

**Complexity**: L

**Status**: Done

**Test Scenarios**:

```gherkin
Scenario: Rename survives later turns
  Given a session titled "Plan the trip"
  When I rename it to "Trip"
  And another turn is recorded
  Then its title is still "Trip" and it moves to the top of the list

Scenario: Owners are isolated
  Given a session owned by alice
  When bob renames or removes it
  Then SessionNotFoundError is raised and alice's entry is unchanged
```
