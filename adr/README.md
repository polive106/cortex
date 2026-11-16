# Architecture Decision Records

We use the [MADR](https://adr.github.io/madr/) format. **Read the relevant ADRs before making an architectural decision.** A change that contradicts an accepted ADR needs a discussion with the user and a new ADR that supersedes it (use the `add-adr` skill).

## Index

| ADR | Title | Status |
|-----|-------|--------|
| [0001](./0001-eve-agent-workspace.md) | eve agent workspace layout | Accepted |
| [0002](./0002-lightweight-hexagonal-architecture.md) | Lightweight hexagonal architecture over eve | Accepted |
| [0003](./0003-frontend-feature-sliced-design.md) | Feature Sliced Design on Next.js with the vendored eve UI | Accepted |
| [0004](./0004-karpathy-style-brain-repo.md) | Karpathy-style LLM wiki in a separate GitHub repo | Amended by 0011 |
| [0005](./0005-brain-write-access.md) | Brain write access: fine-grained token, commits to main | Amended by 0011 |
| [0006](./0006-web-authentication.md) | Web authentication: Sign in with Vercel + email allowlist | Accepted |
| [0007](./0007-testing-strategy.md) | Testing strategy, coverage thresholds, and mockModel tiers | Accepted |
| [0008](./0008-simplify-before-commit.md) | Simplify before every agent commit | Accepted |
| [0009](./0009-tooling-biome-pnpm.md) | Tooling: pnpm workspaces without Turbo, Biome, Node 26 | Accepted |
| [0010](./0010-direct-anthropic-model-routing.md) | Direct Anthropic model routing on the owner's key | Accepted |
| [0011](./0011-brain-writes-without-approval.md) | Brain writes without approval | Accepted |
| [0012](./0012-html-artifacts.md) | HTML artifacts in the brain's out/ folder | Accepted |
| [0013](./0013-session-index-upstash-redis.md) | Session index in Upstash Redis | Accepted |
| [0014](./0014-source-fetching-ssrf-guard.md) | Fetching web sources: public http(s) only, pinned to checked addresses | Accepted |
| [0015](./0015-live-brain-graph.md) | Live brain graph with d3-force, polled by head commit | Accepted |
