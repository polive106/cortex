# cortex

A workspace of [eve](https://eve.dev) agents, deployed to Vercel, that all share one **brain**: a Markdown wiki kept in its own private GitHub repo (`polive106/brain`), following Andrej Karpathy's "LLM wiki" pattern.

The first agent, **companion**, is a chat teammate. It answers from the brain and cites its pages, saves knowledge worth keeping as git commits, fetches web pages on request, and builds HTML artifacts that open in a panel beside the chat. Today you talk to it through a private web UI. Slack is next.

| Agent | Purpose | Status |
|-------|---------|--------|
| `companion` | Chat companion over the shared brain, with a web UI (Slack in E4) | Live in production |
| `companion-test` | A scripted, deterministic double of companion for evals and E2E | Local builds only |

- [What it does](#what-it-does)
- [Why it is built like this](#why-it-is-built-like-this)
- [Architecture](#architecture)
- [Code tour](#code-tour)
- [Security model](#security-model)
- [Testing](#testing)
- [How work gets done here](#how-work-gets-done-here)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Further reading](#further-reading)

---

## What it does

### 1. Ask questions and get cited answers

Every turn, companion gets the brain's writing rules (`AGENTS.md`) and its catalog (`index.md`) in context. When a question may be covered, it uses `search_wiki` and `read_page`, then answers with citations such as `[Onboarding](wiki/onboarding.md)`. The web UI turns those into links to the page on GitHub. If the brain has nothing on the topic, companion says so and labels its answer as general knowledge.

> "What did we decide about the deploy freeze?" → an answer built from `wiki/release-process.md`, with a citation link to it.

### 2. Save knowledge to the brain

Say "save this", paste a document, or share something clearly meant to be kept, and companion runs an **ingest**:

1. It searches for an existing page, because updating a page beats creating a near-duplicate.
2. It reads that page and writes the full **merged** body. It never just appends a "new notes" section.
3. It calls `write_page`. That makes **one commit** holding the immutable source under `raw/`, the created or updated pages under `wiki/`, their lines in `index.md`, and an entry in `log.md`.
4. It tells you what it saved and where, so you can ask for a change or a revert.

Writes need no approval click (ADR-0011). Every write is one commit on `main`, so `git revert` undoes any of them.

### 3. Save or read a web page

Share a URL and companion calls `fetch_source`. The tool fetches public http(s) pages only, converts the HTML to Markdown, and returns the text. Companion can then answer questions about the page, or save it through the ingest flow above with the URL recorded as its origin.

### 4. Build HTML artifacts

Ask for a report, a dashboard, or a one-pager and companion builds a self-contained HTML page:

- It writes the page with Tailwind classes in its sandbox, following a design kit that matches the web app's shadcn look.
- `publish_artifact` compiles only the CSS the page uses, inlines it, adds a strict CSP, and commits the page to `out/<project>/<slug>.html` in the brain.
- The page opens in a sandboxed iframe beside the chat. Each change you ask for is a new version, and you can step back through earlier versions by commit.

### 5. Pick up where you left off

A sidebar lists your earlier conversations, most recent first, and follows you across devices. You can reopen, rename, or delete them. Titles come from your first message, and a rename is never overwritten by later turns.

### 6. See the brain

`/brain` draws the whole wiki as a live force-directed graph: hubs, leaves, and links between pages. It updates within about 5 seconds of a write. In the chat, a brain panel shows the agent's **trail** during a turn (pages it searched, read, and wrote), follows the agent from page to page, and zooms back out when the turn ends.

---

## Why it is built like this

Each choice below is recorded as an ADR in [`adr/`](./adr/README.md), with its context and the alternatives that were rejected. This is the short version.

### The brain is a git repo of Markdown, not a vector store (ADR-0004)

eve's built-in memory holds small facts (64 KB per scope). It isn't built to be a knowledge base. A Karpathy-style wiki is:

- **Readable and correctable by people.** Browse it on GitHub or in Obsidian and fix a wrong page by hand.
- **Audited for free.** Git history records every write, and `git revert` undoes any of them.
- **Durable and shared.** It outlives this codebase, and any future agent can use it.

It lives in a **separate repo** so that brain commits never redeploy the app, and the brain token can't touch agent code. Search starts as index plus grep. A vector or hybrid index is on the ideas list, to be added only once grep is measurably not good enough ("no fancy stuff").

### Writes without approval, but narrowly scoped (ADR-0005, ADR-0011)

The first version asked for approval on every write. In practice that was friction, and with artifacts publishing a new version after every edit, it was worse. Every write is already one revertable commit, so the click was dropped. The trade-off is kept small:

- Agents only get **narrow brain tools**, never general GitHub tools.
- Paths are validated (`PagePath`, `ArtifactPath`), so nothing can be written outside `wiki/` or `out/`.
- The token is fine-grained to one repo and stays server-side.
- Every write is announced in the reply.
- Tools with side effects outside the brain **still** need approval.

### Hexagonal core, thin framework edges (ADR-0002)

The business rules (how to merge an ingest into one commit, how to parse wiki links, which URLs are safe to fetch, how to make an artifact self-contained) must be testable without eve, GitHub, a network, or a model. So:

- `@cortex/domain` holds entities, ports, and use-cases, and has **zero dependencies**.
- `@cortex/adapters` implements every port, and each one has an in-memory twin.
- eve tools are thin controllers: validate with zod, call one use-case, map errors.

Swapping GitHub for another store, or the token for a GitHub App, touches only an adapter. A second agent can reuse every use-case. It stays deliberately lightweight: no event bus, no CQRS, no aggregate roots.

### One eve workspace, one deployment (ADR-0001)

Every agent lives in `agents/<name>/agent/` and shares the root `package.json`, and the whole workspace ships as one Vercel deployment with the Next.js web app. Adding agent number two is `eve init <name>`, with no restructuring. The cost is that agents can't be released independently.

### The repo is agentic (ADR-0007, ADR-0008)

Coding agents write nearly all of the code here, so the rules are enforced by tooling rather than by trust:

- `AGENTS.md` is the single source of rules, and ADRs record the reasons behind them.
- Skills encode the workflows (scaffold, test, review, commit).
- Hooks block the shortcuts: skipping git hooks, committing without the simplify pass, or letting the backlog drift.
- TDD is mandatory, and coverage thresholds fail the build.
- Every commit runs the full check plus deterministic flow evals. None of these call a paid model.

### Pay for tokens directly (ADR-0010)

Agents call Anthropic directly (`anthropic("claude-sonnet-5-5")`) with the owner's key, not through AI Gateway, so billing and rate limits sit on that account. eve's automatic prompt caching was measured to work without extra config.

### Small, boring tooling (ADR-0009)

The stack is Node 26, pnpm workspaces without Turbo, TypeScript 7 (the native compiler), Biome for lint, format, *and* import boundaries, and one root Vitest config. ESLint is out because `typescript-eslint` needs the TypeScript JS API, which TypeScript 7 doesn't ship.

---

## Architecture

### The big picture

```
                     ┌──────────────────────────── Vercel deployment ───────────────────────────┐
                     │                                                                          │
 Browser ── sign in ─┼─► apps/web (Next.js)                                                     │
 (allowlisted email) │     chat · artifact panel · session sidebar · /brain graph               │
                     │        │                                                                 │
                     │        │  /eve/companion/v1/*        (eve chat channel)                  │
                     │        │  /eve/companion/artifacts   (GET page by path & ref)            │
                     │        │  /eve/companion/sessions    (GET / PATCH / DELETE)              │
                     │        │  /eve/companion/brain/graph (GET, ETag = head commit)           │
                     │        ▼                                                                 │
                     │   agents/companion/agent  ── eve runtime: model, tools, memory, hooks    │
                     │        │                                                                 │
                     │        ▼  container.ts picks adapters from env                           │
                     │   @cortex/adapters  ──implements──►  @cortex/domain (ports, use-cases)    │
                     └────────┼──────────────┬──────────────┬──────────────┬────────────────────┘
                              ▼              ▼              ▼              ▼
                     GitHub: polive106/brain  Upstash Redis  public web     Anthropic API
                     (WikiStore)              (SessionIndex) (SourceFetcher) (model)
```

### Layers and the dependency rule

**Dependencies point inward: domain ← adapters ← agents.** Biome's `noRestrictedImports` enforces this per package.

| Layer | Where | Holds | May import |
|-------|-------|-------|------------|
| Domain | `packages/domain` | Entities, value objects, ports (interfaces), use-cases (`execute()` classes) | Only relative paths. No eve, zod, Node APIs, Octokit, or React |
| Adapters | `packages/adapters` | Port implementations, in-memory twins, shared contract tests | Domain, plus what they wrap. Never `eve`, `next`, or `react` |
| Agents | `agents/<name>/agent` | eve config, tools, memory, channels, hooks, sandbox, and `container.ts` | Domain, adapters, eve, zod |
| Web | `apps/web` | Next.js UI, Feature Sliced Design | Its own layers (see below) |

**Build order for a feature:** domain → adapters → agent tools and memory → web → evals and E2E.

### Ports

| Port | What it narrows | Adapters |
|------|-----------------|----------|
| `WikiStore` | The brain repo: `readFile` (optionally at a ref), `head`, `listPages`, `listArtifacts`, `readPages`, and an atomic `commit(changeset)` | `GitHubWikiStore`, `InMemoryWikiStore`, `ReadOnlyWikiStore` (a wrapper) |
| `SourceFetcher` | URL → text | `HttpSourceFetcher` (SSRF-guarded, pinned DNS), `InMemorySourceFetcher` |
| `ArtifactBuilder` | HTML → the CSS it uses | `TailwindArtifactBuilder` (Tailwind v4 JS `compile()`), `InMemoryArtifactBuilder` |
| `SessionIndex` | A per-user list of sessions | `UpstashSessionIndex` (REST over `fetch`, no SDK), `InMemorySessionIndex` |
| `Clock` | `now()` | the system clock in `container.ts`, or fakes in tests |

Every adapter and its twin pass the **same contract test** (`packages/adapters/src/contracts/`), so the in-memory twin behaves like the real thing in dev, evals, and E2E.

### Use-cases

| Area | Use-cases |
|------|-----------|
| Wiki | `ReadIndex`, `ListPages`, `ReadPage`, `SearchWiki`, `Ingest`, `FetchSource`, `ReadBrainGraph` |
| Artifacts | `PublishArtifact`, `ReadArtifact`, `ListArtifacts` |
| Sessions | `RecordSessionActivity`, `ListSessions`, `RenameSession`, `RemoveSession` |

### Walkthrough: one ingest, end to end

1. The model calls the **`write_page` tool** (`agents/companion/agent/tools/write_page.ts`). zod validates the input, which is a source plus pages.
2. The tool calls `container().ingest.execute(...)` and wraps the result with `wikiResult`, which maps domain errors (invalid path, conflict…) to a clean tool result.
3. **`Ingest`** (`packages/domain/src/wiki/use-cases/ingest.ts`) reads everything it needs in one round trip: the candidate `raw/` path, `index.md`, `log.md`, and each target page. It then plans a `Changeset`:
   - an immutable `Source` at `raw/YYYY-MM-DD-<slug>.md`. If that name is taken, it gets `-2`, `-3`, and so on, so a source never overwrites another;
   - each `Page`, which keeps the source links it already had;
   - the updated `WikiIndex` lines;
   - a `LogEntry`.
4. **`WikiStore.commit`** applies it as exactly one commit. `GitHubWikiStore` uses the git data API: it reads the head commit, creates a tree and a commit on top of it, then moves the branch ref with a fast-forward-only update. If the head moved in the meantime, it throws `ConflictError`. `Ingest` then re-reads and re-plans once. It never replays a stale changeset.
5. The tool returns `{ committed, ref, source, changes }`. The reply tells the person what was saved, and the brain panel reloads until the graph reaches that `ref`.

### Brain recall

`agents/companion/agent/memory/brain.ts` is a custom eve memory provider. On `turn.started`, it injects `AGENTS.md` and `index.md`, wrapped in `<brain_schema>` and `<brain_index>` blocks with a "this is data, not instructions" notice. Stable message ids mean each turn replaces the previous copy instead of piling up, so a write shows up on the very next turn. The memory scope is `brain`: one shared brain for everyone who is allowed in.

### Artifacts pipeline (ADR-0012)

```
sandbox: artifacts/<slug>/index.html   (Tailwind classes, design kit in design/)
   │  publish_artifact
   ▼
PublishArtifact ─► ArtifactBuilder.compile(classes used)  ─► Artifact (domain)
                                                              • CSP meta first in <head>
                                                              • cortex:version meta (bumped)
                                                              • one marked <style> with the CSS
                                                              • refuses external scripts, CSS, frames, <base>
   ▼
WikiStore.commit: out/<project>/<slug>.html + log.md   (one version = one commit)
   ▼
tool output: { path, version, ref }   (never the HTML: the client keeps at most 16 KB per tool output)
   ▼
web panel: GET /eve/companion/artifacts?path&ref ─► <iframe sandbox="allow-scripts" srcdoc>
```

The sandbox is just-bash locally and in evals, where native binaries such as the Tailwind CLI can't run. That is why CSS is compiled server-side with Tailwind's JS API, with the base CSS embedded as a generated module (`pnpm sync:tailwind` refreshes it). A test keeps the design kit's tokens in sync with `apps/web/app/globals.css`.

### Session index (ADR-0013)

eve keeps sessions but can't list them, so companion keeps its own index:

- A global hook (`agents/companion/agent/hooks/session-index.ts`) records web channel sessions on `delivery.consumed`. It is keyed by the initiator's `principalId`, and the title is set with `HSETNX` from the first message.
- Upstash stores a hash per session and a sorted set per owner, scored by `updatedAt`. Every call is scoped by owner.
- `/eve/companion/sessions` lists, renames, and deletes. Delete ends the eve session first, then removes the entry.
- If recording fails, the error is logged and the chat is unaffected.

### Brain graph (ADR-0015)

- `BrainGraph.build(index.md, pages)` in the domain is the **only** link parser. It resolves page-relative and root-relative `wiki/` links and drops links to `raw/`, missing pages, or outside the repo.
- `ReadBrainGraph` caches the graph by `WikiStore.head()`. It reuses the head lookup for 2 s and shares in-flight builds, so many open tabs cost about one GitHub request per window.
- The route returns the head as the `ETag`, and the web polls every 5 s with `If-None-Match` (a cheap `304` when nothing changed). Hidden tabs don't poll.
- The web lays out the graph with `d3-force` and renders SVG itself. The chat's agent trail is derived purely from the turn's tool calls (`brainTrail(messages)`), with no extra server route.

### Web app: Feature Sliced Design (ADR-0003)

The UI was scaffolded with `eve add channel/web` (shadcn/ui, AI Elements, eve's approval and trace components), then restructured into feature slices:

```
apps/web/
  app/                    thin routes: /, /s/[sessionId], /brain, /api/auth
  components/ui/          vendored shadcn (never edited by hand)
  components/ai-elements/ vendored AI Elements (never edited by hand)
  lib/                    auth (better-auth + allowlist), utils
  src/features/
    artifacts/            preview panel and version picker
    brain-graph/          /brain screen, trail panel, follow-the-agent
    citations/            Markdown renderer that turns wiki links into citations
    sessions/             sidebar, rename, delete
```

| Path in a feature | Rule |
|-------------------|------|
| `api.ts` | types and the agent name |
| `hooks/` | all state, effects, and `useEveAgent` calls, **one hook per file** |
| `widgets/` | stateless, props only, no hooks |
| `ui/` | wires hooks to widgets |
| `index.ts` | the barrel: the only thing routes may import |

Imports flow routes → features (through barrels) → `lib/`. Never feature → feature, features → routes, or `lib/` → features. E2E selectors use `data-testid` named `{page}-{type}-{name}`.

### Routing on Vercel

`withEve` only forwards `/eve/<name>/v1/*` to an agent. [`vercel.ts`](./vercel.ts) also mounts each agent's extra routes (`/artifacts`, `/sessions`, `/brain/graph`) under `/eve/<name>/…`, and leaves `*-test` agents out of any build that isn't clearly local. That check fails closed.

---

## Code tour

```
agents/
  companion/agent/
    agent.ts              model: anthropic("claude-sonnet-5-5")
    instructions.md       system prompt: identity, brain rules, artifacts, trust boundaries
    container.ts          composition root: the ONLY place that reads env and picks adapters
    channels/             eve.ts (chat, WEB_AUTH), artifacts.ts, sessions.ts, brain.ts (graph route)
    tools/                list_pages, read_page, search_wiki, write_page, fetch_source,
                          list_artifacts, open_artifact, publish_artifact
    memory/brain.ts       recalls AGENTS.md + index.md every turn
    hooks/session-index.ts  records web sessions on delivery.consumed
    skills/artifacts/     how to build a page with the design kit
    sandbox.ts            writes the design kit into the sandbox's design/
    lib/                  route handlers, web auth, design kit, starter and sample brains
  companion/evals/        smoke, prompt caching, secret probing (real model)
  companion-test/         mockModel double: same tools, channels, hook, and memory
    evals/flows/          deterministic flow evals (approval, ingest, artifacts, citations…)
packages/
  domain/src/
    wiki/                 Page, PagePath, Source, SourceUrl, Changeset, WikiIndex, BrainGraph…
    artifacts/            Artifact, ArtifactPath, the ArtifactBuilder port, use-cases
    sessions/             SessionSummary, SessionTitle, the SessionIndex port, use-cases
    auth/                 isAllowedEmail
  adapters/src/
    github-wiki-store/  http-source-fetcher/  tailwind-artifact-builder/  upstash-session-index/
    in-memory-*/  read-only-wiki-store/
    contracts/            shared contract tests every adapter + twin must pass
    testing/              msw fakes for GitHub and Upstash
apps/web/                 Next.js UI (above)
e2e/                      Playwright specs against companion-test
adr/                      architecture decisions (MADR)
docs/backlog/             PRD, epics, and stories
.agents/skills/           workflow skills (symlinked as .claude/skills/)
.claude/hooks/            guard rails for coding agents
```

Adding a capability usually touches, in order: a port or use-case in `packages/domain`, an adapter and twin in `packages/adapters`, wiring in `container.ts`, a thin tool in `agents/companion/agent/tools/`, then (if visible) a web feature slice, and finally a flow eval and an E2E spec. The `scaffold` skill generates each of these the house way.

---

## Security model

| Threat | Mitigation |
|--------|------------|
| Strangers spending the API budget | Sign in with Vercel (better-auth, stateless 8-hour JWE cookie) **plus** an `ALLOWED_EMAILS` allowlist, checked in the web app *and* in the agent's channel auth, so calling the agent routes directly doesn't bypass it. A missing or empty allowlist denies everyone (ADR-0006) |
| Prompt injection from pages, sources, or fetched sites | Recalled brain content is wrapped and marked as data. The instructions say only the people in the chat give instructions. Closing tags inside brain content are neutralised |
| Agent writing where it shouldn't | Narrow tools only. `PagePath` and `ArtifactPath` keep writes inside `wiki/` and `out/`. One commit per write, all revertable |
| SSRF through `fetch_source` | `SourceUrl` (domain) refuses non-http(s) URLs, credentials, local names, and every private, loopback, link-local, CGNAT, and reserved range, including IPv4 embedded in IPv6. `HttpSourceFetcher` resolves each hop once, checks every address, and connects only to those (`pinnedTransport`), which closes the DNS rebinding window. Limits: 10 s, 2 MB, 5 redirects, text types only (ADR-0014) |
| Model-written HTML running with the app's origin | CSP meta, external resources refused, rendered only in `<iframe sandbox="allow-scripts" srcdoc>` without `allow-same-origin` |
| Leaked credentials | Tokens live in server-side env vars, read only in `container.ts`, and never enter prompts, tool inputs, or tool results. A real-model eval probes for secret leaks |
| Test agent in production | `vercel.ts` drops `*-test` agents from every non-local build |
| Data from one user visible to another | Every session index call is scoped by the owner's `principalId` |

---

## Testing

TDD is mandatory: red → green → refactor (ADR-0007). Tests sit next to their source (`foo.ts` + `foo.test.ts`).

| Tier | Tool | Model | Runs |
|------|------|-------|------|
| Domain unit | Vitest | none | pre-commit |
| Adapters | Vitest + msw fakes (never real services) | none | pre-commit |
| Agent tools | Vitest with in-memory adapters | none | pre-commit |
| Agent flows | `eve eval` + `mockModel` on `companion-test` | scripted | pre-commit, CI |
| Web | Vitest + Testing Library (hooks, widgets, ui) | none | pre-commit |
| E2E | Playwright on `vercel dev` against `companion-test` | scripted | pre-push, CI |
| Behavior evals | `eve eval` on `companion`, Haiku as judge | real (paid) | manually, CI on `main` |

**Coverage thresholds fail the run:** 100% for `@cortex/domain`, 95% for `@cortex/adapters` and agent tools, 90% for `apps/web/src/features`.

`companion-test` is the trick that keeps all of this free and deterministic. It shares companion's real tools, channels, memory, and hook, on the in-memory brain, but its "model" is a script. Messages like `save url <url>`, `make artifact <slug>`, `cite welcome`, or `walk brain` trigger exact tool-call sequences, so flow evals and E2E exercise the real stack without spending a token.

---

## How work gets done here

The repo is set up for coding agents (Claude Code and others) to do the bulk of the work, safely:

- **[`AGENTS.md`](./AGENTS.md)** holds the mandatory rules. `CLAUDE.md` imports it.
- **[`docs/backlog/`](./docs/backlog/README.md)** holds the PRD, the epics, and stories with acceptance criteria and test scenarios. Hooks check story format and keep statuses in sync with the README.
- **Skills** in `.agents/skills/` cover the workflows: `discuss-feature` → `create-story` → `scaffold` → `add-unit-tests` / `add-eval` / `add-e2e-tests` → `review` → `commit` → `story-complete`, plus `add-adr`, `debug`, and `fix-ci`.
- **The commit gate (ADR-0008):** the `commit` skill runs `simplify` → `review` → `pnpm check`, stages explicit paths, and records a hash of the staged diff. Husky's `pre-commit` rejects any agent commit whose index doesn't match that hash, then runs `pnpm check` and `pnpm eval` for everyone. A `PreToolUse` hook blocks attempts to skip husky. `pre-push` runs E2E. CI runs everything again as the backstop.
- **Conventional commits** reference story IDs, e.g. `feat(E3-US02): add WikiStore port`. Development is trunk-based on `main`.

---

## Getting started

```bash
nvm use                 # Node 26 (.nvmrc)
pnpm install
pnpm dev:all            # web app + agents via `vercel dev --local` (no sign-in in dev)
```

Without brain credentials, the brain is in memory, seeded from `agents/companion/agent/lib/starter-brain.ts`, and lasts as long as the process. For a richer graph to look at, start with `BRAIN_SEED=sample`. To use a real brain, set `BRAIN_GITHUB_TOKEN` and `BRAIN_REPO` in the root `.env.local`. Real model calls need `ANTHROPIC_API_KEY`. To point the web UI at the free scripted double, set `NEXT_PUBLIC_WEB_CHAT_AGENT=companion-test`.

| Command | What it does |
|---------|--------------|
| `pnpm dev` | eve dev server and terminal UI |
| `pnpm lint` / `pnpm format` | Biome check, or Biome with fixes applied |
| `pnpm typecheck` | tsc for agents, the web app, and every package |
| `pnpm test` / `pnpm test:watch` | Vitest with coverage thresholds, or the TDD loop |
| `pnpm check` | lint + typecheck + test (what pre-commit runs) |
| `pnpm eval` | deterministic flow evals on `companion-test` (free, no key) |
| `pnpm eval:real` | real-model behavior evals on `companion` (needs `ANTHROPIC_API_KEY`) |
| `pnpm test:e2e` | Playwright on `vercel dev` against `companion-test` |
| `pnpm sync:tailwind` | re-embed Tailwind's base CSS for artifacts after upgrading `tailwindcss` |

In Claude Code cloud sessions, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium` for E2E.

---

## Configuration

Local values go in the root `.env.local` (gitignored). Deployed values are Vercel env vars, marked sensitive.

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Direct Anthropic model calls and the eval judge |
| `ALLOWED_EMAILS` | Comma-separated emails allowed in. Empty or missing denies everyone |
| `BETTER_AUTH_SECRET`, `VERCEL_APP_CLIENT_ID`, `VERCEL_APP_CLIENT_SECRET` | Sign in with Vercel. Production fails closed without them |
| `BRAIN_GITHUB_TOKEN`, `BRAIN_REPO`, `BRAIN_BRANCH` | Fine-grained token (Contents read/write on the brain only), `owner/repo`, and branch (default `main`). Together they switch the brain to GitHub |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Upstash Redis for the session index (`UPSTASH_REDIS_REST_*` also work and take precedence) |
| `BRAIN_STORE=memory`, `SESSIONS_STORE=memory`, `SOURCE_FETCHER=memory` | Force the in-memory twins. Set by evals and E2E so they never touch real services |
| `BRAIN_SEED=sample` | Seed the in-memory brain with a linked example brain |

Hosted builds without GitHub settings get a **read-only** brain, so a write that would vanish on the next cold start is refused instead. See [`AGENTS.md`](./AGENTS.md#environment-variables) for the full table.

---

## Deployment

- One Vercel project (`cortex`) ships the web app and every agent. Pushing to `main` deploys, as does `pnpm exec eve deploy --non-interactive --yes` from the root.
- Production: https://cortex-phi-bay.vercel.app. Companion's eve routes are under `/eve/companion/v1/*`.
- After a deploy or an env change, run the smoke eval against production from `agents/companion/`:

```bash
pnpm exec eve eval smoke --url https://cortex-phi-bay.vercel.app/eve/companion
```

eve doesn't fail at boot on a bad key. A misconfigured key only shows up on the first turn, which is why the smoke eval matters.

---

## Roadmap

| Epic | Title | Status |
|------|-------|--------|
| E1 | Foundation | Done |
| E2 | Companion and web chat | Done |
| E3 | Brain (Karpathy LLM wiki) | In progress (real-model behavior evals remain) |
| E4 | Slack: mentions, DMs, approvals, "save this thread" | Pending |
| E5 | Artifacts | Done |
| E6 | Session history | Done |
| E7 | Brain graph | Done |

Ideas, not yet stories: a weekly lint schedule (orphan pages, stale claims, broken links, reusing `BrainGraph`); moving from the fine-grained token to a `companion[bot]` GitHub App; a second agent on the same domain and adapters; per-channel memory in Slack; and a search upgrade, only once grep falls short.

---

## Further reading

- [`adr/`](./adr/README.md): every architectural decision, with context and the alternatives considered
- [`docs/backlog/README.md`](./docs/backlog/README.md): the PRD, domain model, and implementation order
- [`AGENTS.md`](./AGENTS.md): the rules every coding agent follows here
- `node_modules/eve/docs/README.md`: the eve docs for the installed version
