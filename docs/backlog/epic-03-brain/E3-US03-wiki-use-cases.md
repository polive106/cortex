# E3-US03: Wiki use-cases

**User Story**: As the companion, I want well-defined operations to read, search, and ingest knowledge so that every write is consistent and lands as one commit.

**Acceptance Criteria**:
- [x] `ReadIndex` returns the brain's `AGENTS.md` and `index.md` contents, with a size cap and a truncation notice
- [x] `ReadPage(path)` returns the page or throws `PageNotFoundError`
- [x] `SearchWiki(query)` returns ranked page paths with matching snippets (simple text matching; no vectors)
- [x] `ProposeIngest({ source, pages[] })` validates paths and builds a preview (files to create or update, diff summary) without writing
- [x] `ApplyIngest(proposal)` builds a single `Changeset`:
  - [x] raw source
  - [x] page creates or updates
  - [x] index upserts
  - [x] a log append

  It commits once with message `ingest: <title>` and returns the commit ref and page paths.
- [x] `ApplyIngest` refuses when `raw/` already has the source path (the source layer is immutable)
- [x] 100% coverage, tested against a fake `WikiStore`

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Domain | Use-cases | `packages/domain/src/wiki/use-cases/{ReadIndex,ReadPage,SearchWiki,ProposeIngest,ApplyIngest}.ts` |

**Dependencies**: E3-US02

**Complexity**: L

**Status**: Done

**Notes (2026-11-14)**:
- **One use-case:** after review, `ProposeIngest` and `ApplyIngest` became a single `Ingest` use-case.
  - eve approves a tool call before it runs, and the approval prompt only sees the tool input, so a separate proposal step showed nobody anything.
  - AGENTS.md also allows one use-case per tool.
- **How it runs:** `Ingest` reads the brain in one parallel batch, plans, and commits once.
  - The raw source and new pages are `mustNotExist`, so the store enforces raw/ immutability atomically.
  - If the brain moves under the commit, it re-reads and re-plans once.
- **Sources:** updated pages keep their earlier `sources`, and the new source is appended.
