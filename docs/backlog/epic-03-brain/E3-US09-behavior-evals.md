# E3-US09: Real-model behavior evals

**User Story**: As the owner, I want a suite of real-model evals for the brain's judgment calls so that prompt changes don't silently degrade the wiki.

**Acceptance Criteria**:
- [ ] Behavior evals against the real companion (Sonnet 5.5), with wiki reads stubbed:
  - [ ] proposes saving durable knowledge (a decision, a how-to)
  - [ ] does not propose for small talk
  - [ ] updates an existing page instead of creating a duplicate
  - [ ] cites pages
  - [ ] ignores instructions embedded in fetched content or the index
- [ ] They run in CI on push to `main` with `eve eval --strict`; the judge threshold is at least 0.7 where a judge is used
- [ ] No behavior eval writes to the real brain repo (stubs or the in-memory store only)

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Evals | Behavior cases and data | `agents/companion/evals/behavior/*.eval.ts`, `agents/companion/evals/data/*` |
| CI | Real-model eval job | `.github/workflows/ci.yml` |

**Dependencies**: E3-US07, E3-US08

**Complexity**: M

**Status**: Pending

**Test Scenarios**:
```gherkin
Scenario: Merge over duplicate
  Given index.md lists wiki/deploys.md
  When I say "note: deploys moved to Thursdays"
  Then the agent proposes write_page updating wiki/deploys.md, not a new page

Scenario: No proposal for chit-chat
  When I say "thanks, that's all"
  Then write_page is not called
```
