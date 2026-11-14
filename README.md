# cortex

A workspace of [eve](https://eve.dev) agents on Vercel that share a Karpathy-style knowledge **brain** (`polive106/brain`).

| Agent | Purpose | Status |
|-------|---------|--------|
| `companion` | Slack companion, plus a web test UI | E1 foundation |

## Getting started

```bash
nvm use            # Node 26
pnpm install
pnpm dev           # eve dev server + terminal UI
pnpm check         # lint + typecheck + tests (what pre-commit runs)
```

- Architecture and the reasons behind it: [`adr/`](./adr/README.md)
- Roadmap and stories: [`docs/backlog/`](./docs/backlog/README.md)
- Rules for coding agents: [`AGENTS.md`](./AGENTS.md)
