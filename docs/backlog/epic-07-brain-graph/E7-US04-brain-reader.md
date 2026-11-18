# E7-US04: Read brain pages beside the graph

**User Story**: As a user, I want to read brain pages in the app, under the brain graph, so that I can see what companion read or wrote without leaving the chat for GitHub.

**Acceptance Criteria**:

- [x] The chat's brain panel shows the graph on top and a markdown reader below it
- [x] While following is on, the reader shows the page companion last read or wrote
- [x] Clicking a node in the graph opens that page in the reader instead of GitHub
- [x] Clicking a citation in a reply opens the brain panel with that page in the reader, even before companion used the brain and while an artifact is open
- [x] Links to other wiki pages inside the reader open them in the reader, and a back button returns; other links follow the reply's URL policy
- [x] The reader links to the page on GitHub and updates when the brain's head moves
- [x] The full `/brain` view gets a reader pane that opens when a node is clicked
- [x] Page bodies come from `GET /eve/<agent>/brain/page?path=`, behind `WEB_AUTH`, for `index.md` and `wiki/` pages only

**Technical Tasks**:

| Layer  | Task | File(s) |
| ------ | ---- | ------- |
| Domain | Export the page link resolver; `ReadBrainPage` | `packages/domain/src/wiki/{entities/brain-graph.ts,use-cases/read-brain-page.ts}` |
| Agent  | `GET /brain/page` route, wiring, mount | `agents/companion/agent/{lib/brain-page-route.ts,channels/brain.ts,container.ts}`, `vercel.ts` |
| Web    | Page fetch, reader selection, reader widget, split panel, `/brain` pane; capture the pointer only once a node drag starts, so node clicks fire | `apps/web/src/features/brain-graph/**` |
| Web    | Citations open in the drawer; the artifact preview steps aside | `apps/web/lib/brain-reader-context.tsx`, `apps/web/src/features/{citations,artifacts}/**`, `apps/web/app/_components/agent-chat.tsx` |
| E2E    | Reader follows, node click, citation click, links, `/brain` | `e2e/tests/brain/reader.spec.ts` |

**Dependencies**: E7-US03

**Complexity**: M

**Status**: Done

**Test Scenarios**:

```gherkin
Scenario: The reader follows the agent
  Given I'm in the chat
  When I send "walk brain"
  Then the reader shows the last page the agent visited

Scenario: Opening a citation
  Given a reply cites the welcome page
  When I click the citation
  Then the brain panel opens with the welcome page in the reader

Scenario: Opening a node
  Given the brain panel is open
  When I click a node
  Then the reader shows that page
```
