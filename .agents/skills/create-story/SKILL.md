---
name: create-story
description: Create a backlog story (and its epic if needed) with agent-derived technical tasks and test scenarios.
---

## Input

From the user or `discuss-feature`: title, user story, acceptance criteria, target epic, complexity, known dependencies. Derive everything else from the codebase.

## Steps

1. Read `docs/backlog/README.md`, the epic READMEs, and relevant ADRs.
2. Read the code the story touches. Decide the affected layers (Domain, Adapters, Agent, Web, Evals, E2E) and exact file paths following existing conventions.
3. New epic? Create `docs/backlog/epic-NN-<slug>/README.md` with the same shape as `epic-01-foundation/README.md`.
4. Next story ID in the epic (`E3-US08`). Create `docs/backlog/epic-NN-<slug>/EN-USXX-<slug>.md` from the template.
5. Add the story to the epic README table **and** to the implementation order in `docs/backlog/README.md` (a hook warns otherwise).
6. Verify dependency IDs exist; show the user the result.

## Template

````markdown
# EN-USXX: <Title>

**User Story**: As <role>, I want <capability> so that <benefit>.

**Acceptance Criteria**:

- [ ] ...

**Technical Tasks**:

| Layer    | Task | File(s)                      |
| -------- | ---- | ---------------------------- |
| Domain   | ...  | `packages/domain/src/...`    |
| Adapters | ...  | `packages/adapters/src/...`  |
| Agent    | ...  | `agents/companion/agent/...` |
| Web      | ...  | `apps/web/src/features/...`  |
| Evals    | ...  | `agents/companion/evals/...` |
| E2E      | ...  | `e2e/...`                    |

**Dependencies**: <story IDs or "None">

**Complexity**: <XS/S/M/L/XL>

**Status**: Pending

**Test Scenarios**:

```gherkin
Scenario: ...
  Given ...
  When ...
  Then ...
```
````

All seven bold sections are required (a hook validates them). Drop table rows for untouched layers.
