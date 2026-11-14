---
name: add-eval
description: Add eve eval cases — deterministic mockModel flow evals (run pre-commit) and real-model behavior evals (run in CI) — for an agent's tools and judgment.
---

Source of truth: `node_modules/eve/docs/evals/` — `index.mdx` (defineEval, `mockModel`), `cases.mdx` (multi-turn, `requireInteraction`, `respond`), `assertions.mdx` (`calledTool`, `toolOrder`, `awaitingInput`, gates vs soft), `tool-stubs.mdx` (stubs + permitting them), `judge.mdx`, `running.mdx` (`--strict`, exit codes, CI). Read the relevant page first.

## Two kinds

| Kind | Agent | Model | Runs | Tests |
|------|-------|-------|------|-------|
| **Flow** (deterministic) | a separate test agent whose `agent.ts` uses `mockModel(...)` from `eve/evals`, in-memory brain | scripted | pre-commit + CI | tool loop wiring, approval park/resume, recall injected, errors mapped |
| **Behavior** (judgment) | the real `companion` | Sonnet 5.5 | CI on push to `main`, or manually | proposes saves at the right time, merges instead of duplicating, cites pages, ignores injected instructions |

`mockModel` is part of the agent definition, so flow evals target a dedicated test agent, never `companion` itself.

## Flow eval shape

```ts
import { defineEval } from "eve/evals";

export default defineEval({
  description: "write_page parks for approval and commits after approve",
  async test(t) {
    const turn = await t.send("save: deploys happen on Fridays");
    const approval = turn.session.requireInteraction();     // gate: exactly one pending
    const done = await turn.session.respond(/* approve approval */);
    done.expectOk();
    t.calledTool("write_page", { count: 1 });
  },
});
```

Script the model with the callback form: return `{ toolCalls: [...] }` until the expected `toolResults` arrive, then text.

## Behavior eval rules

- Use tool stubs for `read_page` / `search_wiki` so cases don't depend on the live brain; never let a behavior eval write to the real brain repo.
- Prefer gates (`calledTool`, `messageIncludes`) over `t.judge`; use the judge for fuzzy quality with `.atLeast(0.7)`.
- CI runs `eve eval --strict` so soft threshold misses fail.
- Every bug in model behavior gets a regression case.

## Commands

```bash
pnpm eval                                    # all evals (flow evals need no API key)
pnpm exec eve eval <id> --agent companion    # one eval
pnpm exec eve eval --strict --junit .eve/junit.xml
```
