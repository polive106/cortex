# E3-US08: Citations in answers and the web UI

**User Story**: As a user, I want answers drawn from the brain to cite their pages with links so that I can verify and correct the source.

**Acceptance Criteria**:
- [ ] Instructions require a citation for any claim drawn from a wiki page, formatted `[Page title](wiki/path.md)`
- [ ] The web UI renders citations as links to the page on GitHub (`https://github.com/polive106/brain/blob/main/<path>`) with `data-testid="chat-link-citation-<slug>"`
- [ ] The `Citation` widget is props only and unit tested
- [ ] A real-model eval checks that an answer grounded in a stubbed page cites it

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Agent | Citation rule | `agents/companion/agent/instructions.md` |
| Web | Citation widget and link mapping | `apps/web/src/features/chat/widgets/Citation.tsx` |
| E2E | Citation link | `e2e/tests/brain/citations.spec.ts` |

**Dependencies**: E3-US06

**Complexity**: S

**Status**: Pending

**Test Scenarios**:
```gherkin
Scenario: Cited answer
  Given wiki/deploys.md says deploys happen on Fridays
  When I ask "when do we deploy?"
  Then the reply mentions Friday and links to wiki/deploys.md
```
