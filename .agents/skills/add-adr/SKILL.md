---
name: add-adr
description: Record an architectural decision as a MADR-style ADR in adr/ and update the index. Use whenever a choice constrains future code (structure, dependencies, auth, storage, testing, tooling).
---

## Steps

1. Read `adr/README.md` and any related ADRs. If the new decision changes an old one, the old ADR's status becomes `Superseded by NNNN` (or `Amended by NNNN`); never delete or rewrite history.
2. Next number = highest existing + 1, zero-padded to 4 digits.
3. Create `adr/NNNN-<kebab-title>.md` from the template.
4. Add a row to the index table in `adr/README.md`.
5. If the decision adds or changes a rule, update `AGENTS.md`.
6. Commit via the `commit` skill: `docs(adr): NNNN <title>`.

## Template

```markdown
# ADR-NNNN: <Title>

## Status

Accepted | Proposed | Superseded by NNNN | Amended by NNNN

## Context

What forces are at play: the problem, constraints, and what we know (cite eve docs or measurements where relevant).

## Decision

What we decided, stated so an agent can follow it as a rule.

## Consequences

### Positive
- ...

### Negative
- ...

## Alternatives Considered
- **<Option>**: why not
```

Keep it short: one decision per ADR. Write it so a future agent can check code against it.
