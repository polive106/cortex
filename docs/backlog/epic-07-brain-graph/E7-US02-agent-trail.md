# E7-US02: Agent trail on the brain graph

**User Story**: As a user, I want to watch companion move through the brain while it answers so that I can see which pages it relies on and what it changes.

**Acceptance Criteria**:

- [ ] A "Brain" side panel in the chat shows the graph next to the conversation
- [ ] Each `read_page`, `search_wiki` hit, and `write_page` or ingest of the current session lights its node, in order; the latest step pulses and older steps fade
- [ ] Edges between consecutive steps are drawn in the trail colour
- [ ] The trail is parsed from the chat's messages (`brainTrail(messages)`), like artifact versions; no new server route

**Technical Tasks**:

| Layer | Task | File(s) |
| ----- | ---- | ------- |
| Web | Trail parser from tool calls | `apps/web/src/features/brain-graph/api.ts` |
| Web | Side panel wiring in the chat | `apps/web/src/features/brain-graph/ui/`, `apps/web/app/_components/agent-chat.tsx` |
| E2E | "read note" lights the node | `e2e/tests/brain/trail.spec.ts` |

**Dependencies**: E7-US01

**Complexity**: M

**Status**: Pending

**Test Scenarios**:

```gherkin
Scenario: The agent's reads light up
  Given the brain panel is open in the chat
  When I send "cite welcome"
  Then the welcome node is marked as the latest step
```
