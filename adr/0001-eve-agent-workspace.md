# ADR-0001: eve agent workspace layout

## Status

Accepted (2026-11-14)

## Context

cortex will host several agents. The first is `companion`, a Slack companion with a web test UI, deployed to Vercel. eve supports a single root agent (`agent/`), subagents, an agent workspace (`agents/<name>/agent/`), or independent projects linked as remote agents.

## Decision

Use an **eve agent workspace** from day one:

- `agents/<name>/agent/`: one directory per root agent. Members share the root `package.json` and must **not** have their own `package.json` (eve excludes them from discovery).
- `apps/web/`: a peer Next.js app (not an eve member).
- `packages/*`: shared TypeScript packages (see ADR-0002).
- All members ship in **one Vercel deployment** (`eve link` and `eve deploy` from the root). Each agent's routes are `/eve/<name>/v1/*`.

## Consequences

### Positive
- Adding agent #2 is `npx eve init <name>` from the root: no restructuring.
- One dependency tree, one deploy, one CI run.

### Negative
- Agents can't be released independently. An agent that needs its own release schedule must move to its own project and be called as a remote agent.

## Alternatives Considered
- **Single agent now, workspace later**: simpler today, but requires moving files and updating routes and clients later.
- **One project per agent**: independent releases, but more setup and cross-deployment wiring for no current benefit.
