# E3-US04: In-memory and GitHub wiki store adapters

**User Story**: As a developer, I want a real GitHub-backed store and an in-memory twin with identical behavior so that local dev and tests never need the real brain.

**Acceptance Criteria**:
- [ ] `InMemoryWikiStore` implements `WikiStore` and can be seeded from a fixture folder or object
- [ ] `GitHubWikiStore({ token, owner, repo, branch })` implements `WikiStore` with the GitHub REST API:
  - [ ] reads contents
  - [ ] lists the tree
  - [ ] searches by listing plus a content scan
  - [ ] commits a whole `Changeset` as **one commit** (blobs → tree → commit → update ref)
- [ ] Ref update conflicts (main moved) retry once by rebuilding on the new head, then raise `ConflictError`
- [ ] A shared contract test `describeWikiStoreContract` passes for both adapters; GitHub is faked with msw
- [ ] The token comes only from the constructor; it's never logged or put in error messages
- [ ] 95% coverage

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Adapters | In-memory store | `packages/adapters/src/in-memory-wiki-store/*` |
| Adapters | GitHub store | `packages/adapters/src/github-wiki-store/*` |
| Adapters | Contract test | `packages/adapters/src/contracts/wikiStoreContract.ts` |

**Dependencies**: E3-US02

**Complexity**: L

**Status**: Pending

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
