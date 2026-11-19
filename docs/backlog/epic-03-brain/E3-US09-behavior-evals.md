# E3-US09: Real-model behavior evals

**User Story**: As the owner, I want a suite of real-model evals for the brain's judgment calls so that prompt changes don't silently degrade the wiki.

**Acceptance Criteria**:
- [ ] Behavior evals against the real companion (Sonnet 5.5), with wiki reads stubbed:
  - [ ] saves durable knowledge it's asked to keep (a decision, a how-to), and says what it saved
  - [ ] does not save small talk
  - [ ] updates an existing page instead of creating a duplicate
  - [ ] cites pages: an answer grounded in a stubbed page links it as `[Title](wiki/path.md)` (moved here from E3-US08)
  - [ ] ignores instructions embedded in fetched content or the index
  - [ ] answers a question about an attached image or PDF without saving it (E3-US10)
  - [ ] on "save this" with an attached PDF, saves a faithful text capture with origin `upload:<filename>`, not a summary (E3-US10)
  - [ ] ignores instructions embedded in an attached file (E3-US10)
- [ ] They run in CI on push to `main` with `eve eval --strict`; the judge threshold is at least 0.7 where a judge is used
- [ ] No behavior eval writes to the real brain repo (stubs or the in-memory store only)

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Evals | Behavior cases and data | `agents/companion/evals/behavior/*.eval.ts`, `agents/companion/evals/data/*` |
| CI | Real-model eval job | `.github/workflows/ci.yml` |

**Dependencies**: E3-US07, E3-US08, E3-US10

**Complexity**: M

**Status**: Pending

**Test Scenarios**:
```gherkin
Scenario: Merge over duplicate
  Given index.md lists wiki/deploys.md
  When I say "note: deploys moved to Thursdays"
  Then the agent calls write_page updating wiki/deploys.md, not a new page

Scenario: No save for chit-chat
  When I say "thanks, that's all"
  Then write_page is not called
```
