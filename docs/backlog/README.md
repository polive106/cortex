# cortex — Product Requirements

## Vision

cortex is a home for several eve agents that share one **brain**: a Karpathy-style LLM wiki kept as Markdown in a separate private GitHub repo (`BRAIN_REPO`). The first agent, **companion**, is a chat companion. You test it first in a private web UI and later bring it into Slack. It answers from the brain, citing pages. When it sees knowledge worth keeping, it saves it as one revertable commit, and it builds HTML artifacts shown beside the chat.

## Principles

- **The repo is agentic**: `AGENTS.md`, ADRs, skills, and hooks make the rules enforceable. Every commit is simplified, reviewed, and checked.
- **Hexagonal core**: business logic lives in `@cortex/domain` with zero dependencies. eve tools are thin adapters.
- **The brain is git**: the agent writes without asking (ADR-0011), and every write is one revertable git commit.
- **No fancy stuff**: no vector database, no PR flow, no custom design system until a real need shows up.

## Domain model

| Concept | Description |
|---------|-------------|
| **Page** | A Markdown file under `wiki/` in the brain: a title, a body, and links to other pages and sources |
| **Source** | An immutable original kept under `raw/YYYY-MM-DD-<slug>.md`: pasted text, a fetched URL, a text capture of an uploaded PDF or image, or a Slack thread |
| **IndexEntry** | One line in `index.md`: page path, title, one-line summary |
| **LogEntry** | One append-only line in `log.md`: date, operation (ingest/query/lint), summary, commit |
| **Changeset** | The full set of file writes for one ingest: source, pages, index, log. Applied as **one commit** |
| **Ports** | `WikiStore` (read/list/search/commit), `SourceFetcher` (URL → text), `Clock`, `ArtifactBuilder` (HTML → CSS), `SessionIndex` (per-user session list) |
| **SessionSummary** | One entry in a user's session list: session id, owner, title, created and updated times |
| **Artifact** | A self-contained HTML page under `out/` (`out/<project>/<slug>.html` or `out/<slug>.html`), styled with the shadcn design kit. Each publish is a new version |
| **Use-cases** | `ReadIndex`, `ReadPage`, `SearchWiki`, `ProposeIngest`, `ApplyIngest`, `PublishArtifact`, `ReadArtifact`, `ListArtifacts` |

## Brain repo layout

```
AGENTS.md   schema: conventions the agent follows when writing (recalled every turn)
index.md    catalog of every page with a one-line summary (recalled every turn)
log.md      append-only record of ingests, queries, lints
raw/        immutable sources (text only)
wiki/       pages maintained by the agent
out/        HTML artifacts, optionally grouped by project
```

## Epics

| Epic | Title | Status |
|------|-------|--------|
| [E1](./epic-01-foundation/README.md) | Foundation | Done |
| [E2](./epic-02-companion-web/README.md) | Companion and web chat | Done |
| [E3](./epic-03-brain/README.md) | Brain (Karpathy LLM wiki) | In Progress |
| [E4](./epic-04-slack/README.md) | Slack | Pending |
| [E5](./epic-05-artifacts/README.md) | Artifacts | Done |
| [E6](./epic-06-sessions/README.md) | Session history | Done |
| [E7](./epic-07-brain-graph/README.md) | Brain graph | Done |

## Implementation order

1. E1-US01: pnpm workspace, Node 26, Biome, TypeScript, Vitest coverage
2. E1-US02: husky hooks and the Claude Code simplify gate
3. E1-US03: AGENTS.md, CLAUDE.md, and ADRs 0001–0009
4. E1-US04: skills, backlog, and doc-sync hooks
5. E1-US05: GitHub repo and CI workflow
6. E2-US01: companion instructions and persona
7. E2-US02: Anthropic credentials and prompt caching verification
   - then E1-US06: Vercel link and first deploy (deferred until the Anthropic key is wired)
8. E2-US03: web channel scaffold and FSD restructure
9. E2-US04: Vercel sign-in and email allowlist
10. E2-US07: markdown URL hardening in chat replies (added after the E2-US04 security review)
11. E2-US05: mockModel flow evals and Playwright E2E setup
12. E2-US06: approvals UI hook and widget
13. E3-US01: brain repo bootstrap
14. E3-US02: domain entities and ports
15. E3-US03: wiki use-cases
16. E3-US04: in-memory and GitHub wiki store adapters
17. E3-US05: wiki tools with approval on writes
18. E3-US06: recall of AGENTS.md and index.md every turn
19. E5-US01: brain writes without approval (before URL ingestion, so it lands on the new rule)
20. E3-US07: URL fetching and pasted-text ingestion
21. E5-US02: artifact domain
22. E5-US03: Tailwind artifact builder and artifact listing
23. E5-US04: sandbox and shadcn design kit
24. E5-US05: artifact tools and route
25. E5-US06: artifact preview panel
26. E5-US07: artifact flow evals and E2E
27. E6-US01: session index domain and Upstash adapter (ADR-0013)
28. E6-US02: session recording hook and sessions route
29. E6-US03: session sidebar with rename and delete
30. E3-US08: citations in answers and the web UI
31. E7-US01: live brain graph screen (ADR-0015)
32. E7-US02: agent trail on the brain graph
33. E7-US03: follow the agent in the brain panel
34. E7-US04: read brain pages beside the graph (ADR-0016)
35. E3-US10: PDF and image attachments in web chat (before E3-US09, so the behavior evals cover attachments)
36. E3-US09: real-model behavior evals
37. E4-US01: Slack channel via Vercel Connect
38. E4-US02: mentions and DMs
39. E4-US03: approvals in Slack
40. E4-US04: "save this thread" ingestion

## Later / ideas (not yet stories)

- **Weekly lint schedule**: an eve schedule that checks the brain for orphan pages, stale claims, contradictions, and missing links, and reports findings without writing.
- **GitHub App migration**: replace the fine-grained token with a `companion[bot]` GitHub App limited to the brain repo.
- **Second agent**: add `agents/<name>/` sharing `@cortex/domain` and `@cortex/adapters`.
- **Per-channel memory**: eve memory scoped by Slack channel.
- **Search upgrade**: vector or hybrid search, only once grep over the wiki is measurably too slow or imprecise.

## Complexity reference

| Size | Meaning |
|------|---------|
| XS | Config or docs only, under an hour |
| S | One layer, a few files |
| M | Two or three layers, new tests in each |
| L | Cross-cutting, new port or adapter, plus evals |
| XL | Should probably be split |
