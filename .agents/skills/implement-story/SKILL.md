---
name: implement-story
description: Implement a backlog story end to end with TDD, following the cortex layer order (Domain → Adapters → Agent → Web → Evals/E2E).
disable-model-invocation: true
---

cortex is trunk-based: commit straight to `main` through the `commit` skill. Each commit must leave `main` green.

## Steps

1. **Read the story** in `docs/backlog/epic-*/E*-US*.md`. Every acceptance criterion must be satisfied. Set its status to `In Progress` in the story file **and** the epic README table.
2. **Read the relevant ADRs** (`adr/README.md`). If the story conflicts with an ADR, stop and discuss with the user.
3. **Follow the layer order**, TDD in each layer (failing test → minimum code → refactor):
   1. **Domain** `packages/domain/src/`: entities, ports (interfaces), use-cases (`execute()`). Zero dependencies.
   2. **Adapters** `packages/adapters/src/`: implement the port, plus its in-memory twin.
   3. **Agent** `agents/<agent>/agent/`: thin tools (`tools/`), wiring (`container.ts`), memory, instructions.
   4. **Web** `apps/web/src/features/<feature>/`: hooks → widgets → ui → thin route.
   5. **Evals** `agents/<agent>/evals/`: `mockModel` flow evals for any new tool or flow (`add-eval`).
   6. **E2E** `e2e/`: Playwright for user-visible behavior (`add-e2e-tests`).
4. Use `scaffold` for new ports, adapters, tools, and slices.
5. **Verify**:

   ```bash
   pnpm check       # lint + typecheck + unit tests + coverage
   pnpm eval        # deterministic evals
   pnpm test:e2e    # when web behavior changed
   ```
6. **Commit** in small steps with the `commit` skill (one per layer is a good rhythm).
7. Finish with `story-complete`.

## Definition of Done

- [ ] All acceptance criteria checked
- [ ] Coverage thresholds hold (100% domain, 95% adapters + tools, 90% web features)
- [ ] `pnpm check`, `pnpm eval`, and (if applicable) `pnpm test:e2e` pass
- [ ] New architectural decisions captured with `add-adr`
- [ ] `AGENTS.md` updated if a rule or command changed
- [ ] Story and epic README status set to `Done`
