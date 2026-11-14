# E3-US03: Wiki use-cases

**User Story**: As the companion, I want well-defined operations to read, search, and ingest knowledge so that every write is consistent and lands as one commit.

**Acceptance Criteria**:
- [ ] `ReadIndex` returns the brain's `AGENTS.md` and `index.md` contents, with a size cap and a truncation notice
- [ ] `ReadPage(path)` returns the page or throws `PageNotFoundError`
- [ ] `SearchWiki(query)` returns ranked page paths with matching snippets (simple text matching; no vectors)
- [ ] `ProposeIngest({ source, pages[] })` validates paths and builds a preview (files to create or update, diff summary) without writing
- [ ] `ApplyIngest(proposal)` builds a single `Changeset`:
  - [ ] raw source
  - [ ] page creates or updates
  - [ ] index upserts
  - [ ] a log append

  It commits once with message `ingest: <title>` and returns the commit ref and page paths.
- [ ] `ApplyIngest` refuses when `raw/` already has the source path (the source layer is immutable)
- [ ] 100% coverage, tested against a fake `WikiStore`

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Domain | Use-cases | `packages/domain/src/wiki/use-cases/{ReadIndex,ReadPage,SearchWiki,ProposeIngest,ApplyIngest}.ts` |

**Dependencies**: E3-US02

**Complexity**: L

**Status**: Pending

**Test Scenarios**:
```gherkin
Scenario: One commit per ingest
  Given a proposal creating wiki/deploys.md from a pasted note
  When ApplyIngest executes
  Then WikiStore.commit is called once with raw/, wiki/deploys.md, index.md and log.md

Scenario: Update merges into the index
  Given wiki/deploys.md already indexed
  When an ingest updates it
  Then index.md still has exactly one entry for it
```
