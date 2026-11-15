# E6-US02: Session recording hook and sessions route

**User Story**: As a user, I want each web session I start to show up in my list automatically so that I never have to save it myself.

**Acceptance Criteria**:

- [x] A global hook records activity on `delivery.consumed` for web channel sessions only, owned by the initiator's `principalId`; the first message's text becomes the title
- [x] Sessions with no user initiator (schedules, the runtime) aren't recorded
- [x] `GET /sessions` lists the caller's sessions, newest first
- [x] `PATCH /sessions?id=` with `{ title }` renames; `DELETE /sessions?id=` ends the eve session, then removes the entry
- [x] The route uses `WEB_AUTH`, answers 400/404 as JSON, and is mounted at `/eve/<agent>/sessions` by `vercel.ts`
- [x] companion-test shares the hook and the route

**Technical Tasks**:

| Layer  | Task | File(s)                      |
| ------ | ---- | ---------------------------- |
| Agent  | Recording hook | `agents/companion/agent/hooks/session-index.ts`, `agents/companion/agent/lib/session-activity.ts` |
| Agent  | Sessions route and channel | `agents/companion/agent/lib/sessions-route.ts`, `agents/companion/agent/channels/sessions.ts` |
| Agent  | Test double shares them | `agents/companion-test/agent/{hooks,channels}/` |
| Agent  | Mount `/sessions` | `vercel.ts` |
| Evals  | Flow eval: list, rename, delete | `agents/companion-test/evals/flows/sessions.eval.ts` |

**Dependencies**: E6-US01

**Complexity**: M

**Status**: Done

**Test Scenarios**:

```gherkin
Scenario: First message names the session
  Given a signed-in user
  When they send "Plan the trip to Lisbon"
  Then their list has one session titled "Plan the trip to Lisbon"

Scenario: Delete ends the session
  Given one of my sessions
  When I DELETE /sessions?id=<it>
  Then eve ends the session and it leaves my list
```
