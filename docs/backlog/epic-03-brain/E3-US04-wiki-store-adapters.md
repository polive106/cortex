# E3-US04: In-memory and GitHub wiki store adapters

**User Story**: As a developer, I want a real GitHub-backed store and an in-memory twin with identical behavior so that local dev and tests never need the real brain.

**Acceptance Criteria**:
- [x] `InMemoryWikiStore` implements `WikiStore` and can be seeded from a fixture folder or object
- [x] `GitHubWikiStore({ token, owner, repo, branch })` implements `WikiStore` with the GitHub REST API:
  - [x] reads contents
  - [x] lists the tree
  - [x] searches by listing plus a content scan
  - [x] commits a whole `Changeset` as **one commit** (blobs → tree → commit → update ref)
- [x] Ref update conflicts (main moved) retry once by rebuilding on the new head, then raise `ConflictError`
- [x] A shared contract test `describeWikiStoreContract` passes for both adapters; GitHub is faked with msw
- [x] The token comes only from the constructor; it's never logged or put in error messages
- [x] 95% coverage

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Adapters | In-memory store | `packages/adapters/src/in-memory-wiki-store/*` |
| Adapters | GitHub store | `packages/adapters/src/github-wiki-store/*` |
| Adapters | Contract test | `packages/adapters/src/contracts/wikiStoreContract.ts` |

**Dependencies**: E3-US02

**Complexity**: L

**Status**: Done

**Notes (2026-11-14)**:
- **Tree building:** the GitHub store creates the tree with inline `content` instead of separate blob calls. It's still one tree, one commit, and one ref update.
- **Retries:** when `main` moves, the store raises `ConflictError` rather than replaying the same blobs on the new head, which would drop a concurrent ingest's index or log lines. `Ingest` re-reads, re-plans, and retries once (E3-US03), which covers "retry once by rebuilding on the new head" one layer up.
- **`mustNotExist` writes:** checked against the head tree before the commit is created.
- **Token:** it lives in a private field and only goes into the `Authorization` header. Errors name the method, route and status.
- **Truncated trees:** if GitHub truncates the tree listing, the store fails loudly.

**Test Scenarios**:
```gherkin
Scenario: Single commit
  Given a changeset touching 4 files
  When GitHubWikiStore.commit runs
  Then exactly one POST /git/commits and one PATCH /git/refs/heads/main are sent

Scenario: Head moved
  Given the ref update returns 422 once
  When commit runs
  Then it rebuilds on the new head and succeeds

Scenario: Token never leaks
  Given GitHub returns 401
  Then the thrown error message does not contain the token
```
