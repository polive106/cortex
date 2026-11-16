# E7-US01: Live brain graph screen

**User Story**: As a user, I want to see the brain as a graph of pages and links that updates live so that I can understand its shape and watch it grow.

**Acceptance Criteria**:

- [x] `/brain` shows an INDEX hub ("N articles") linked to every page in `index.md`, and an edge for every link between two pages (relative or `wiki/` links)
- [x] Pages are sized by their number of links; leaves are smaller and dimmer; labels are the page file names
- [x] The graph updates within 5 s of a commit, without reshuffling: new pages start next to a neighbour and fade in
- [x] Pan, zoom (wheel and pinch), drag nodes, hover highlights a node and its neighbours, search dims the rest and Enter centres the best match, click opens the page on GitHub
- [x] `GET /eve/<agent>/brain/graph` is behind `WEB_AUTH`, uses the head commit as its ETag, and answers 304 when unchanged; an unchanged brain costs one GitHub request per poll
- [x] The session sidebar links to `/brain`, and the graph links back to the chat
- [x] The canvas accepts an agent trail, ready for E7-US02

**Technical Tasks**:

| Layer | Task | File(s) |
| ----- | ---- | ------- |
| Domain | Link graph from index and pages | `packages/domain/src/wiki/entities/brain-graph.ts` |
| Domain | `head()` on the port, cached graph use-case | `packages/domain/src/wiki/ports/wiki-store.ts`, `packages/domain/src/wiki/use-cases/read-brain-graph.ts` |
| Adapters | `head()` for GitHub, in-memory, read-only; contract test | `packages/adapters/src/*-wiki-store/`, `packages/adapters/src/contracts/wiki-store-contract.ts` |
| Agent | Route, channel, container, sample brain | `agents/companion/agent/lib/brain-graph-route.ts`, `agents/companion/agent/channels/brain.ts`, `agents/companion/agent/lib/sample-brain.ts`, `vercel.ts` |
| Web | Feature slice: polling, layout, viewport, focus, canvas, header | `apps/web/src/features/brain-graph/` |
| Web | Route and shared auth gate | `apps/web/app/brain/page.tsx`, `apps/web/app/_components/authenticated.tsx` |
| E2E | Graph opens; a saved page appears live | `e2e/tests/brain/graph.spec.ts` |

**Dependencies**: E3-US02, E6-US03

**Complexity**: L

**Status**: Done

**Test Scenarios**:

```gherkin
Scenario: Open the graph
  Given I'm in the chat
  When I click the brain link in the sidebar
  Then I see the INDEX hub and the welcome page

Scenario: A new page appears live
  Given the brain graph is open in another tab
  When I ask companion to save a note
  Then the note's node appears in the graph within a few seconds
```
