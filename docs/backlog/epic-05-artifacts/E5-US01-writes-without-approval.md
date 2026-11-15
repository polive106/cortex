# E5-US01: Brain writes without approval

**User Story**: As the owner, I want the companion to save to the brain without asking me every time so that iterating on pages and artifacts isn't a chain of approval clicks.

**Acceptance Criteria**:

- [x] ADR-0011 supersedes the approval part of ADR-0004 and ADR-0005; both are marked `Amended by 0011`
- [x] `write_page` has no approval; it commits as soon as it's called
- [x] Instructions, AGENTS.md, the review skill, and the PRD principle no longer promise approval for brain writes
- [x] Flow evals cover a write committing straight away and an outside path being refused
- [x] The approvals UI stays, exercised by `demo_action`

**Technical Tasks**:

| Layer | Task | File(s) |
| ----- | ---- | ------- |
| Agent | Drop the approval from `write_page` | `agents/companion/agent/tools/write_page.ts` |
| Agent | Instructions: save without asking, say what was saved | `agents/companion/agent/instructions.md` |
| Evals | Rewrite the write flow evals | `agents/companion-test/evals/flows/write-page.eval.ts` |
| Docs | ADR-0011, AGENTS.md, review skill, PRD | `adr/0011-brain-writes-without-approval.md`, `AGENTS.md`, `.agents/skills/review/SKILL.md` |

**Dependencies**: E3-US05

**Complexity**: S

**Status**: Done

**Test Scenarios**:

```gherkin
Scenario: A write commits without approval
  Given the in-memory brain
  When the agent calls write_page
  Then the store has one new commit and no approval was requested

Scenario: Path outside wiki
  When write_page is called with "AGENTS.md"
  Then the tool returns an invalid-path error and nothing is committed
```
