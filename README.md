# cortex

A workspace of [eve](https://eve.dev) AI agents, deployed to Vercel, that share one **brain**: a Markdown wiki kept in its own private GitHub repo, following Andrej Karpathy's "LLM wiki" pattern.

The first agent, **companion**, is a chat teammate. It answers questions from the brain and cites the pages it used, saves knowledge worth keeping as git commits, reads public web pages on request, and builds HTML artifacts (reports, one-pagers, dashboards) that open beside the chat. You talk to it through a private web UI today; Slack is next.

## Features

- **Cited answers** from the shared wiki, with links back to each page.
- **Save to the brain**: every write is one revertable commit that merges into existing pages instead of duplicating them.
- **Web pages**: fetch a public URL, ask about it, or save it.
- **Artifacts**: self-contained HTML pages, versioned in the brain and shown in a sandboxed iframe.
- **Session history** that follows you across devices.
- **Brain graph**: a live view of the wiki and of the pages the agent touches during a turn.

## How it was built

- **[eve](https://eve.dev)** for the agents (model, tools, memory, channels), calling Anthropic's Claude directly.
- **Next.js** web app with shadcn/ui and AI Elements, behind Sign in with Vercel and an email allowlist.
- **GitHub** as the brain's storage, **Upstash Redis** for the session index, **Tailwind** to compile artifact CSS.
- **TypeScript 7**, **pnpm** workspaces, **Biome**, **Vitest**, and **Playwright**.
- Built almost entirely by coding agents, with test-driven development, coverage thresholds, and hooks that enforce the rules in [`AGENTS.md`](./AGENTS.md). Decisions are recorded as ADRs in [`adr/`](./adr/README.md) and the work is planned in [`docs/backlog/`](./docs/backlog/README.md).

## Architecture

The code is hexagonal and lightweight. Dependencies point inward: **domain ← adapters ← agents**.

```
apps/web               Next.js UI (Feature Sliced Design)
agents/<name>/agent    eve agents: config, thin tools, memory, channels
                       container.ts wires adapters from env
packages/adapters      GitHub, Upstash, HTTP, Tailwind adapters + in-memory twins
packages/domain        entities, ports, and use-cases, with zero dependencies
```

- **Domain** holds the business rules (ingesting a source in one commit, parsing wiki links, validating paths and URLs) and can be tested without eve, a network, or a model.
- **Adapters** implement each port, and each has an in-memory twin that passes the same contract tests.
- **Agent tools** are thin: validate the input, call one use-case, map errors to a result.
- **`companion-test`** is a scripted double of companion that runs the real stack without a model, so flow evals and E2E tests are free and deterministic.

## Getting started

```bash
nvm use        # Node 26
pnpm install
pnpm dev:all   # web app + agents locally
pnpm check     # lint + typecheck + tests
```

Without brain credentials, the brain lives in memory. See [`AGENTS.md`](./AGENTS.md) for configuration, commands, and deployment.
