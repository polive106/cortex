# E7-US02: Agent trail on the brain graph

**User Story**: As a user, I want to watch companion move through the brain while it answers so that I can see which pages it relies on and what it changes.

**Acceptance Criteria**:

- [x] A "Brain" panel beside the chat opens by itself the first time the agent uses the brain in a conversation; once closed it stays closed, and a "Brain" button reopens it
- [x] While the artifact preview is open, the brain panel waits behind its button
- [x] Each `read_page` (as soon as it starts), `search_wiki` top hit, and page written by `write_page` is a step; a line hops from each step's page to the next, coloured by action (read amber, search blue, write green), drawing itself in, with older hops fading and only the last 8 shown
- [x] The latest page pulses (faster while the call runs), touched pages are ringed in their action's colour, and untouched pages dim
- [x] A page the agent writes appears in the panel straight away: the panel reloads until the graph reaches the commit `write_page` returned
- [x] The trail is parsed from the chat's messages (`brainTrail(messages)`), like artifact versions; no new server route. The panel only polls the graph while it's open

**Technical Tasks**:

| Layer | Task | File(s) |
| ----- | ---- | ------- |
| Web | Trail parser from tool calls, action colours | `apps/web/src/features/brain-graph/api.ts` |
| Web | Trail and panel state; refresh on write; shared stage wiring | `apps/web/src/features/brain-graph/hooks/{use-brain-trail,use-brain-graph,use-graph-stage}.ts` |
| Web | Hop layer on the canvas; panel and open button | `apps/web/src/features/brain-graph/widgets/{brain-graph-canvas,brain-trail-panel,brain-open-button}.tsx` |
| Web | Panel UI and chat layout | `apps/web/src/features/brain-graph/ui/brain-trail-preview.tsx`, `apps/web/app/_components/agent-chat.tsx`, `apps/web/src/features/artifacts/hooks/use-artifact-versions.ts` |
| Agent | "walk brain" scripted message (search, then read) | `agents/companion-test/agent/agent.ts` |
| E2E | Panel opens and marks the read; a write appears as the latest step | `e2e/tests/brain/trail.spec.ts` |

**Dependencies**: E7-US01

**Complexity**: M

**Status**: Done

**Test Scenarios**:

```gherkin
Scenario: The agent's reads light up
  Given I'm in the chat
  When I send "walk brain"
  Then the brain panel opens
  And the welcome page is marked as the latest step

Scenario: A write appears live
  When I send "save note x"
  Then the note's page appears in the brain panel as the latest step
```
