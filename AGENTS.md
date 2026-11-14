# AGENTS.md

Source of truth for every coding agent working in this repo. `CLAUDE.md` imports this file. The rules below are mandatory, and a hook or a check enforces most of them.

## Project overview

**cortex** is a workspace of [eve](https://eve.dev) agents deployed to Vercel. The first agent, `companion`, is a Slack companion (Slack arrives in E4) with a web test UI. All agents share the **brain**: a Karpathy-style LLM wiki in the private repo `polive106/brain` (ADR-0004).

## Key resources

| Resource | Purpose |
|----------|---------|
| `adr/` | Architecture Decision Records (MADR). **Read the relevant ADRs before any architectural change.** |
| `docs/backlog/` | Epics and user stories. `docs/backlog/README.md` is the PRD and implementation order. |
| `.agents/skills/` | Workflow skills (symlinked to `.claude/skills/`) |
| `node_modules/eve/docs/` | eve docs matching the installed version. Start with `README.md`. |

## Skills

| Skill | When to use |
|-------|-------------|
| `discuss-feature` | Exploring a new feature idea before writing stories |
| `create-story` | Adding stories or epics to the backlog |
| `review-backlog` | Deciding what to work on next |
| `scaffold` | Creating ports, adapters, use-cases, eve tools, or FSD slices |
| `add-unit-tests` | Writing unit or integration tests |
| `add-e2e-tests` | Writing Playwright E2E tests |
| `add-eval` | Writing eve evals (`mockModel` flows or real-model behavior) |
| `add-adr` | Recording an architectural decision |
| `review` | Security and quality checklist before committing |
| `commit` | **The only way to commit** (simplify → review → check → mark → commit) |
| `debug` | Structured debugging |
| `fix-ci` | Fixing CI failures |
| `story-complete` | Verifying and closing a story |

## Repository layout

```
agents/<name>/agent/     eve root agents (no package.json here; ADR-0001)
  agent.ts               model + runtime config (companion: anthropic/claude-sonnet-5.5)
  instructions.md        always-on system prompt
  channels/ tools/ memory/ skills/ schedules/
  container.ts           composition root: picks adapters from env
packages/domain          @cortex/domain: entities, ports, use-cases. Zero deps.
packages/adapters        @cortex/adapters: port implementations + in-memory twins
apps/web                 Next.js test UI (E2), Feature Sliced Design
adr/  docs/backlog/  .agents/skills/  .claude/hooks/
```

## Architecture rules (ADR-0002)

Hexagonal and lightweight. **Dependencies point inward: domain ← adapters ← agents.**

1. `@cortex/domain` has **zero external dependencies**: no eve, zod, Octokit, Node APIs, or React. Biome blocks non-relative imports there.
2. Every external system sits behind a **port** (a plain interface in the domain), with an adapter in `@cortex/adapters` **and** an in-memory twin.
3. Use-cases are classes with one `execute()` method that receive ports through the constructor.
4. **eve tools are thin**: zod input → one use-case → map domain errors to a tool result. No business logic in tools.
5. Adapters never import `eve`, `next`, or `react` (enforced by Biome).
6. Wiring lives only in `agents/<name>/agent/container.ts`.

**Build order for a feature:** domain → adapters → agent tools/memory → web → evals and E2E.

## Brain rules (ADR-0004, ADR-0005)

- Agents get only the **narrow wiki tools** (`list_pages`, `read_page`, `search_wiki`, `write_page`). Never add general GitHub tools.
- `write_page` **always requires human approval** (`approval: always()`).
- One approved ingest = **one commit** covering `raw/`, the pages, `index.md`, and `log.md`. Merge into existing pages instead of appending duplicates.
- Wiki paths are validated by `PagePath` (`wiki/<kebab>.md`) and nothing may escape `wiki/`.
- Credentials (`BRAIN_GITHUB_TOKEN`, API keys) live in server-side env vars and **never** enter prompts, tool inputs, or tool results.

## Frontend rules (ADR-0003)

`apps/web/src/features/<feature>/`:

| Path | Rule |
|------|------|
| `api.ts` | types + agent name |
| `hooks/` | all state, effects, and `useEveAgent` calls. **One hook per file.** |
| `widgets/` | stateless, **props only, no hooks**; compose vendored components |
| `ui/` | wires hooks + widgets |
| `index.ts` | barrel; the only import surface for routes |

- `app/` routes are thin: they render a `ui/` component.
- Imports: routes → features (barrels) → `lib/`. Never features → routes, `lib/` → features, or feature → feature.
- `components/ui/**` and `components/ai-elements/**` are **vendored**: don't edit them by hand.
- E2E selectors use `data-testid` only, named `{page}-{type}-{name}` (e.g. `chat-btn-send`).

## TDD and testing (ADR-0007)

**Never write implementation code without a failing test first.** Red → green → refactor, one behavior at a time.

- Colocate tests: `foo.ts` + `foo.test.ts`. No `__tests__/` directories.
- Coverage thresholds fail the run: **100%** `@cortex/domain`, **95%** `@cortex/adapters` and agent tools, **90%** `apps/web/src/features`.
- Agents' flows are tested with `eve eval` + `mockModel`. Real-model behavior evals run manually and in CI, never in hooks.
- Adapters that call HTTP are tested with msw, never against real services.

## Commit process (ADR-0008)

**Always commit through the `commit` skill.** It runs `simplify`, `review`, `pnpm check`, stages explicit paths, runs `.claude/hooks/mark-simplified.sh`, then commits.

- Husky `pre-commit` blocks agent commits (`CLAUDECODE` set) unless the index being committed matches the simplify marker, then runs `pnpm check` for everyone.
- A `PreToolUse` hook blocks attempts to skip husky (`--no-verify`, `-n`, `core.hooksPath`, `HUSKY=0`). `pre-push` runs E2E from E2 onwards.
- Conventional commits, referencing story IDs: `feat(E3-US02): add WikiStore port`.
- Work happens on `main` (trunk-based). Keep commits atomic.

## Commands

```bash
nvm use                 # Node 26 (.nvmrc)
pnpm install
pnpm dev:all            # web app + agent locally (no sign-in in dev)
pnpm dev                # eve dev server + TUI (use `pnpm exec eve dev --no-ui` from scripts/agents)
pnpm lint               # Biome (lint + format check + import boundaries)
pnpm format             # Biome, applying fixes
pnpm typecheck          # tsc for agents + every package
pnpm test               # Vitest (root config, all projects) with coverage thresholds
pnpm check              # lint + typecheck + test (what pre-commit runs)
pnpm eval               # eve eval for companion (real model + Haiku judge; needs ANTHROPIC_API_KEY)
pnpm test:watch         # TDD loop
```

## Environment variables

Local values go in the root `.env.local` (gitignored; `eve link` also writes `VERCEL_OIDC_TOKEN` there). Deployed values are Vercel env vars, marked sensitive. Never print them.

| Variable | Where | Purpose |
|----------|-------|---------|
| `ANTHROPIC_API_KEY` | local, production, preview | Direct Anthropic model calls and the eval judge (ADR-0010) |
| `VERCEL_OIDC_TOKEN` | local (written by `eve link`) | Vercel OIDC for local CLI calls to deployments |
| `ALLOWED_EMAILS` | production, preview | Comma-separated emails allowed into the web UI and the agent; missing or empty denies everyone (ADR-0006) |
| `BETTER_AUTH_SECRET`, `VERCEL_APP_CLIENT_ID`, `VERCEL_APP_CLIENT_SECRET` | production, preview (written by `eve add channel/web`) | Sign in with Vercel; production fails closed without them |

Set a deployed value from `.env.local` without echoing it:
`grep '^NAME=' .env.local | cut -d= -f2- | tr -d '"\n' | vercel env add NAME --environment production --sensitive --force --yes`

## Deployment

- The Vercel project `cortex` is in the `polive106s-projects` scope; `eve link` set it up and connected the GitHub repo.
- Production is at https://cortex-phi-bay.vercel.app, and companion's routes are under `/eve/companion/v1/*`.
- `pnpm exec eve deploy --non-interactive --yes` from the root deploys every workspace member. Pushing to `main` also deploys.
- After a deploy or an env change, run the smoke eval against production from `agents/companion/`: `pnpm exec eve eval smoke --url https://cortex-phi-bay.vercel.app/eve/companion`.

## Working with eve

- Read the matching page in `node_modules/eve/docs/` (start at `README.md`) **before** writing tools, connections, channels, memory, skills, subagents, schedules, or deployment config. Stop reading once the file location, imports, and definition shape are clear.
- Before integrating an external product, check the registry: `pnpm exec eve registry search <query> --json`, then `eve add <item> --non-interactive`. On exit code 2, run the reported `next.command`, and never pass secrets in `--answer`.
- Keep bundles small: import SDK clients inside the functions that use them.
- Deploy with `pnpm exec eve link --non-interactive --project <name>` and `pnpm exec eve deploy --non-interactive --yes`.
- New agents: `pnpm exec eve init <name>` from the root, then add an ADR if their role is new.

## Process rules

- Use `pnpm add` (with `--filter` or `-w`) to change dependencies. Never hand-edit versions.
- Update `docs/backlog` status as you work. Hooks check story format and README sync.
- A change that contradicts an ADR needs a discussion with the user and a new superseding ADR.
