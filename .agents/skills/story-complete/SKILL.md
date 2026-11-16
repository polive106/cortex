---
name: story-complete
description: Verify a story is really done (criteria, tests, evals, docs) and update its status everywhere.
---

## Steps

1. Read the story file in `docs/backlog/`.
2. For each acceptance criterion, find the code or test that proves it. Check the box only with evidence.
3. Run:

   ```bash
   pnpm check
   pnpm eval
   pnpm test:e2e   # if the story touched apps/web or an agent channel
   ```
4. Confirm docs: ADR added for any new decision, `AGENTS.md` updated for new rules/commands, brain schema (`polive106/brain` `AGENTS.md`) updated if wiki conventions changed.
5. Set `**Status**: Done` in the story file **and** the epic README table (hooks warn on mismatch).
6. If every story in the epic is Done, update the epic row in `docs/backlog/README.md`.
7. Run `review-backlog` to pick the next story.

A story is not Done if any criterion lacks evidence, a threshold was lowered to pass, or a test was skipped.
