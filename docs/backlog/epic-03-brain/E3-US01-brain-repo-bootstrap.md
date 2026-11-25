# E3-US01: Brain repo bootstrap

**User Story**: As the owner, I want a private brain repo with a clear schema so that both the agent and I know how knowledge is organized.

**Acceptance Criteria**:
- [x] A private brain repo exists with `AGENTS.md`, `index.md`, `log.md`, `raw/.gitkeep`, `wiki/.gitkeep`
- [x] Brain `AGENTS.md` defines:
  - [x] page naming (kebab-case slugs under `wiki/`, optional subfolders by kind)
  - [x] page frontmatter (title, summary, sources, updated)
  - [x] linking rules (relative links to pages and `raw/` sources)
  - [x] merge-over-append
  - [x] the index line format
  - [x] the log line format (`## [YYYY-MM-DD] ingest | <title>`)
  - [x] "never store secrets"
- [x] A fine-grained token limited to the brain repo with Contents read/write is created by the owner and stored as `BRAIN_GITHUB_TOKEN` in Vercel; it's never committed
- [x] `BRAIN_REPO` (`owner/repo`) and `BRAIN_BRANCH` (default `main`) are documented in `AGENTS.md`

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Brain | Initial files and schema | brain repo: `AGENTS.md`, `index.md`, `log.md`, `raw/`, `wiki/` |
| Docs | Env vars and brain conventions pointer | `AGENTS.md` (cortex) |

**Dependencies**: E1-US05

**Complexity**: S

**Status**: Done

**Notes (2026-11-14)**:
- **Repo:** the brain repo was created private and bootstrapped from `agents/companion/agent/lib/starter-brain.ts`, the same files that seed the in-memory brain.
  - Instead of `wiki/.gitkeep`, the bootstrap ships `wiki/welcome.md`, which `index.md` lists.
- **Token:** created by the owner, limited to the repo, with Contents read/write.
  - Verified: 200 on `brain`, push permission granted, 404 on `cortex`.
  - Stored as a sensitive Vercel variable in production and preview, never committed. `BRAIN_REPO` is set there too.
- **Write path verified on real GitHub** with the real container and `Ingest`, on a throwaway branch that was then deleted:
  - one commit on top of `main` with the raw source, page, `index.md` and `log.md`;
  - the page reads back, search finds it, and re-using a raw source is refused.
- **Production:** reads the real brain. A list-pages turn used exactly 3 GitHub calls with the token.

**Test Scenarios**:
```gherkin
Scenario: Token scope
  Given BRAIN_GITHUB_TOKEN
  When it is used to read polive106/cortex
  Then GitHub returns 404 (no access)

Scenario: Schema present
  Given the brain repo
  Then AGENTS.md, index.md and log.md exist on main
```
