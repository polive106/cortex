# E3-US02: Domain entities and ports

**User Story**: As a developer, I want the brain's concepts modeled in pure TypeScript so that wiki logic is testable without GitHub, eve, or a model.

**Acceptance Criteria**:
- [x] Value objects and entities:
  - [x] `PagePath`: only `wiki/**/*.md`; rejects `..`, absolute paths, and other folders
  - [x] `SourcePath` (`raw/YYYY-MM-DD-<slug>.md`)
  - [x] `Page`: parse and serialize frontmatter and body
  - [x] `Source`
  - [x] `IndexEntry` and `Index` (parse, upsert, serialize `index.md`)
  - [x] `LogEntry` (format a line)
  - [x] `Changeset` (an ordered set of file writes)
- [x] Ports: `WikiStore` (`readFile`, `listPages`, `search`, `commit(changeset, message)`), `SourceFetcher` (`fetch(url) → { title, text }`), `Clock`
- [x] Domain errors: `InvalidPathError`, `PageNotFoundError`, `SourceFetchError`, `ConflictError`
- [x] Zero external imports; 100% coverage

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Domain | Entities and value objects | `packages/domain/src/wiki/entities/*.ts` |
| Domain | Ports | `packages/domain/src/wiki/ports/*.ts` |
| Domain | Errors | `packages/domain/src/wiki/errors.ts` |

**Dependencies**: E1-US01

**Complexity**: M

**Status**: Done

**Notes (2026-11-14)**:
- **File names:** kebab-case under `packages/domain/src/wiki/{entities,ports}/`, matching the repo convention.
- **`Index`:** named `WikiIndex` to avoid clashing with the `index.ts` barrels.
- **`WikiStore.readPages()` replaces `search`:** all matching and ranking live in `SearchWiki`, not in each adapter.
- **Write preconditions:** a `Changeset` write can be `mustNotExist`. `commit` enforces it atomically on the head it commits onto and raises `ConflictError`, as it does when the head moved. Callers retry by re-planning, never by replaying a stale changeset.
- **New error:** `InvalidIngestError`, for an ingest with no pages or the same page twice.
- **Old error:** `PagePath` now throws the shared `InvalidPathError` instead of `InvalidPagePathError`.

**Test Scenarios**:
```gherkin
Scenario: Path traversal rejected
  When PagePath.parse("wiki/../AGENTS.md")
  Then InvalidPathError is thrown

Scenario: Index upsert keeps order and replaces summary
  Given index.md with an entry for wiki/deploys.md
  When the entry is upserted with a new summary
  Then there is still one line for wiki/deploys.md with the new summary
```
