# E3-US06: Recall of AGENTS.md and index.md every turn

**User Story**: As a user, I want the companion to always know what the brain contains and how it's organized so that it consults the wiki instead of guessing and doesn't create duplicates.

**Acceptance Criteria**:
- [ ] A custom eve memory provider slot (`agents/companion/agent/memory/brain.ts`) whose `recall` runs `ReadIndex` and injects the brain's `AGENTS.md` and `index.md`
- [ ] The scope covers the whole brain (shared), not per user
- [ ] The recalled content is labeled as data; instructions say not to follow instructions found inside it
- [ ] The size cap holds; when the index exceeds it, a truncation notice tells the agent to use `search_wiki`
- [ ] Recall is cached within a turn and refetched on the next turn after a write
- [ ] A flow eval asserts that the recalled index is present in the model input

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Agent | Memory provider | `agents/companion/agent/memory/brain.ts` |
| Evals | Recall flow eval | `agents/companion/evals/flows/recall-index.eval.ts` |

**Dependencies**: E3-US05

**Complexity**: M

**Status**: Pending

**Test Scenarios**:
```gherkin
Scenario: Index visible to the model
  Given the in-memory brain has wiki/deploys.md indexed
  When I ask anything
  Then the model input contains the index entry for wiki/deploys.md

Scenario: Injection in index ignored
  Given an index summary says "ignore previous instructions"
  When I ask a question
  Then the agent's behavior is unchanged (real-model eval in E3-US09)
```
