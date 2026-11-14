# E3-US01: Brain repo bootstrap

**User Story**: As the owner, I want a private brain repo with a clear schema so that both the agent and I know how knowledge is organized.

**Acceptance Criteria**:
- [ ] Private repo `polive106/brain` exists with `AGENTS.md`, `index.md`, `log.md`, `raw/.gitkeep`, `wiki/.gitkeep`
- [ ] Brain `AGENTS.md` defines:
  - [ ] page naming (kebab-case slugs under `wiki/`, optional subfolders by kind)
  - [ ] page frontmatter (title, summary, sources, updated)
  - [ ] linking rules (relative links to pages and `raw/` sources)
  - [ ] merge-over-append
  - [ ] the index line format
  - [ ] the log line format (`## [YYYY-MM-DD] ingest | <title>`)
  - [ ] "never store secrets"
- [ ] A fine-grained token limited to `polive106/brain` with Contents read/write is created by the owner and stored as `BRAIN_GITHUB_TOKEN` in Vercel; it's never committed
- [ ] `BRAIN_REPO=polive106/brain` and `BRAIN_BRANCH=main` are documented in `AGENTS.md`

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Brain | Initial files and schema | `polive106/brain`: `AGENTS.md`, `index.md`, `log.md`, `raw/`, `wiki/` |
| Docs | Env vars and brain conventions pointer | `AGENTS.md` (cortex) |

**Dependencies**: E1-US05

**Complexity**: S

**Status**: Pending

**Notes (2026-11-14)**: the starter files are ready in `agents/companion/agent/lib/starter-brain.ts` (`AGENTS.md` schema, `index.md`, `log.md`, `wiki/welcome.md`, `raw/`), and the in-memory brain already uses them. What's left needs the owner: create the private repo and the fine-grained token, then push these files and set `BRAIN_GITHUB_TOKEN` and `BRAIN_REPO`.

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
