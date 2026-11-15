# E5-US06: Artifact preview panel

**User Story**: As a user, I want the artifact shown beside the chat so that I can see each change as soon as it's published and go back to earlier versions.

**Acceptance Criteria**:

- [x] A right-hand panel opens when an artifact is published or opened, and follows the newest version
- [x] A version picker lists every version from the conversation; picking one loads that commit
- [x] The page renders in `<iframe sandbox="allow-scripts" srcdoc>`: no same-origin access, and its CSP blocks the network
- [x] The panel can be closed and reopened; on small screens it covers the chat
- [x] Feature slice under `apps/web/src/features/artifacts/` with 90% coverage; widgets have no hooks

**Technical Tasks**:

| Layer | Task | File(s) |
| ----- | ---- | ------- |
| Web | Types, version parsing, URL | `apps/web/src/features/artifacts/api.ts` |
| Web | Hooks | `apps/web/src/features/artifacts/hooks/{use-artifact-versions,use-artifact-html}.ts` |
| Web | Widgets | `apps/web/src/features/artifacts/widgets/{artifact-panel,artifact-open-button}.tsx` |
| Web | UI and layout | `apps/web/src/features/artifacts/ui/artifact-preview.tsx`, `apps/web/app/_components/agent-chat.tsx` |

**Dependencies**: E5-US05

**Complexity**: M

**Status**: Done

**Test Scenarios**:

```gherkin
Scenario: New version opens the panel
  When a publish_artifact call completes in the conversation
  Then the panel opens on that version

Scenario: Earlier version
  Given versions 1 and 2
  When I pick version 1
  Then the frame shows version 1's page
```
