# E6-US03: Session sidebar with rename and delete

**User Story**: As a user, I want a sidebar of my earlier sessions so that I can go back to one, rename it, or delete it.

**Acceptance Criteria**:

- [x] A left sidebar lists my sessions, newest first; clicking one opens `/s/<id>`, and the current one is highlighted
- [x] The list refreshes when a turn settles, so a new session appears after its first reply
- [x] Rename edits the title in place (Enter saves, Escape cancels); delete asks for confirmation, and deleting the open session goes to `/s`
- [x] Sessions idle longer than the session timeout show an "Expired" badge
- [x] The sidebar collapses; on small screens it starts closed and covers the chat when open
- [x] Feature slice under `apps/web/src/features/sessions/` with 90% coverage; widgets have no hooks; `data-testid` selectors named `chat-*`

**Technical Tasks**:

| Layer | Task | File(s)                      |
| ----- | ---- | ---------------------------- |
| Web   | Types, URL, expiry | `apps/web/src/features/sessions/api.ts` |
| Web   | List, rename, delete state | `apps/web/src/features/sessions/hooks/use-sessions.ts` |
| Web   | Sidebar and row widgets | `apps/web/src/features/sessions/widgets/{session-sidebar,session-row}.tsx` |
| Web   | UI and layout | `apps/web/src/features/sessions/ui/session-history.tsx`, `apps/web/app/_components/agent-chat.tsx` |
| E2E   | List, reopen, rename, delete | `e2e/tests/chat/sessions.spec.ts` |

**Dependencies**: E6-US02

**Complexity**: M

**Status**: Done

**Test Scenarios**:

```gherkin
Scenario: Reopen an earlier session
  Given I sent "ping" in a session
  When I start a new chat and click that session in the sidebar
  Then the chat shows "ping" and "pong"

Scenario: Rename and delete
  Given a session in the sidebar
  When I rename it to "Renamed"
  Then the sidebar shows "Renamed"
  When I delete it and confirm
  Then it leaves the sidebar
```
