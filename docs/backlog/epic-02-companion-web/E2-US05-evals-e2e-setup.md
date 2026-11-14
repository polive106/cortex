# E2-US05: mockModel flow evals and Playwright E2E setup

**User Story**: As a developer, I want deterministic agent and browser tests that cost no tokens so that pre-commit and pre-push catch regressions in the flow.

**Acceptance Criteria**:
- [ ] A test agent with `mockModel` from `eve/evals` exists for flow evals; it shares the companion's tools and channel config
- [ ] `pnpm eval` runs the deterministic evals with no `ANTHROPIC_API_KEY`, and husky pre-commit runs it
- [ ] Playwright is configured (`playwright.config.ts`, `e2e/`) against the web app plus the mock agent, with a sign-in fixture
- [ ] `pnpm test:e2e` runs in husky pre-push and in CI, with Chromium installed in CI
- [ ] CI also runs real-model evals (`eve eval --strict`) on push to `main`, with `ANTHROPIC_API_KEY` as a GitHub secret

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Agent | Mock test agent | `agents/companion-test/agent/agent.ts` (or the location the eve docs recommend) |
| Evals | Flow smoke eval | `agents/companion/evals/flows/*.eval.ts` |
| E2E | Config, fixtures, smoke spec | `playwright.config.ts`, `e2e/fixtures/*`, `e2e/tests/smoke.spec.ts` |
| CI | Eval and E2E jobs | `.github/workflows/ci.yml`, `.husky/pre-push`, `.husky/pre-commit` |

**Dependencies**: E2-US03, E2-US04

**Complexity**: M

**Status**: Pending

**Test Scenarios**:
```gherkin
Scenario: Deterministic reply
  Given the mock agent replies "pong"
  When the eval sends "ping"
  Then t.succeeded() and the reply includes "pong"

Scenario: Browser smoke
  Given a signed-in allowlisted user
  When they send a message
  Then chat-row-message-1 shows the mock reply
```
