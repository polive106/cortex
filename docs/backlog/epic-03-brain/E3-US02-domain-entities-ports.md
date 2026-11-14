# E3-US02: Domain entities and ports

**User Story**: As a developer, I want the brain's concepts modeled in pure TypeScript so that wiki logic is testable without GitHub, eve, or a model.

**Acceptance Criteria**:
- [ ] Value objects and entities:
  - [ ] `PagePath`: only `wiki/**/*.md`; rejects `..`, absolute paths, and other folders
  - [ ] `SourcePath` (`raw/YYYY-MM-DD-<slug>.md`)
  - [ ] `Page`: parse and serialize frontmatter and body
  - [ ] `Source`
  - [ ] `IndexEntry` and `Index` (parse, upsert, serialize `index.md`)
  - [ ] `LogEntry` (format a line)
  - [ ] `Changeset` (an ordered set of file writes)
- [ ] Ports: `WikiStore` (`readFile`, `listPages`, `search`, `commit(changeset, message)`), `SourceFetcher` (`fetch(url) → { title, text }`), `Clock`
- [ ] Domain errors: `InvalidPathError`, `PageNotFoundError`, `SourceFetchError`, `ConflictError`
- [ ] Zero external imports; 100% coverage

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Domain | Entities and value objects | `packages/domain/src/wiki/entities/*.ts` |
| Domain | Ports | `packages/domain/src/wiki/ports/*.ts` |
| Domain | Errors | `packages/domain/src/wiki/errors.ts` |

**Dependencies**: E1-US01

**Complexity**: M

**Status**: Pending

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
