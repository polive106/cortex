# E3-US05: Wiki tools with approval on writes

**User Story**: As the owner, I want the companion to have only narrow wiki tools, with every write waiting for my approval, so that it can never touch anything but the brain and never writes without consent.

**Acceptance Criteria**:
- [ ] Tools in `agents/companion/agent/tools/`:
  - [ ] `list_pages`
  - [ ] `read_page`
  - [ ] `search_wiki`
  - [ ] `write_page`: `{ source, pages[], reason }` → `ProposeIngest` → `ApplyIngest`, with `approval: always()`
- [ ] Each tool is thin: Zod input, then one use-case, then domain errors mapped to model-readable text
- [ ] `container.ts` uses `GitHubWikiStore` when `BRAIN_GITHUB_TOKEN` and `BRAIN_REPO` are set, and `InMemoryWikiStore` otherwise; `process.env` is read only here
- [ ] The approval prompt shows the page paths and the reason
- [ ] Instructions tell the agent to search before proposing and to prefer updating existing pages
- [ ] Tool unit tests (95% coverage) plus a `mockModel` flow eval: propose → park → approve → one commit; deny → no commit

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Agent | Tools | `agents/companion/agent/tools/{list_pages,read_page,search_wiki,write_page}.ts` |
| Agent | Composition root | `agents/companion/agent/container.ts` |
| Agent | Instructions update | `agents/companion/agent/instructions.md` |
| Evals | Flow evals | `agents/companion/evals/flows/write-page-approval.eval.ts` |

**Dependencies**: E3-US03, E3-US04, E2-US06

**Complexity**: M

**Status**: Pending

**Test Scenarios**:
```gherkin
Scenario: Approved write
  Given the in-memory brain
  When the agent proposes write_page and I approve
  Then the store has one new commit with the page, index and log updated

Scenario: Denied write
  When I deny the write_page approval
  Then the store has no new commit

Scenario: Path outside wiki
  When write_page is called with "AGENTS.md"
  Then the tool returns an invalid-path error and nothing is committed
```
