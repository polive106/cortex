# E3-US08: Citations in answers and the web UI

**User Story**: As a user, I want answers drawn from the brain to cite their pages with links so that I can verify and correct the source.

**Acceptance Criteria**:
- [x] Instructions require a citation for any claim drawn from a wiki page, formatted `[Page title](wiki/path.md)`
- [x] The web UI renders citations as links to the page on GitHub (`https://github.com/<BRAIN_REPO>/blob/<BRAIN_BRANCH>/<path>`, no link when `BRAIN_REPO` is unset) with `data-testid="chat-link-citation-<slug>"`; any other relative link is still dropped
- [x] The `Citation` widget is props only and unit tested
- [x] The `companion-test` double can answer with a citation, so E2E covers the link without a model
- [x] The real-model check that a grounded answer cites its page is the "cites pages" case of E3-US09

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Agent | Citation rule | `agents/companion/agent/instructions.md` |
| Web | Citation slice: link mapping, rehype plugin, widget | `apps/web/src/features/citations/*`, `apps/web/app/_components/agent-message.tsx` |
| Agent | Scripted cited answer | `agents/companion-test/agent/agent.ts` |
| E2E | Citation link | `e2e/tests/chat/citations.spec.ts` |

**Dependencies**: E3-US06

**Complexity**: S

**Status**: Done

**Test Scenarios**:
```gherkin
Scenario: Cited answer
  Given wiki/deploys.md says deploys happen on Fridays
  When I ask "when do we deploy?"
  Then the reply mentions Friday and links to wiki/deploys.md
```
