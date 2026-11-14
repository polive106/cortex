---
name: debug
description: Systematic debugging for cortex — reproduce, locate the layer, write a failing test, fix the root cause.
---

## Steps

1. **Reproduce** with the smallest input. Note exact error text.
2. **Locate the layer**: domain, adapter, tool/container, eve runtime/channel, web, or model behavior.
3. **Write a failing test** at that layer (unit test, `mockModel` eval, or Playwright).
4. **Fix the root cause**, not the symptom. If the fix is model behavior (instructions), add a real-model eval case.
5. **Verify**: the new test passes, then `pnpm check`.

## Useful commands

```bash
pnpm exec eve dev --no-ui --agent companion        # agent server without the TUI
pnpm exec eve info --agent companion               # discovered tools, channels, memory
pnpm exec eve eval <eval-id> --agent companion     # one eval
pnpm --filter @cortex/domain test -- <file>        # one unit test file
pnpm test:e2e --headed                             # watch the browser
```

Drive the HTTP API directly: `POST /eve/companion/v1/session`, stream `GET /eve/companion/v1/session/:id/stream`.

## Layer tips

| Layer | Usual suspects |
|-------|----------------|
| Domain | Unhandled edge case in path/merge/changeset logic |
| Adapters | GitHub API shape (tree/commit refs), 404 vs empty, rate limits |
| Tools/container | Wrong adapter picked (env missing), error not mapped, approval not set |
| eve runtime | Read `node_modules/eve/docs/README.md` routing table before guessing |
| Web | `useEveAgent` agent name, stale session, interaction not responded |
| Model | Instructions ambiguous, index too large, recalled content treated as instructions |
