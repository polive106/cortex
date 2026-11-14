# E3-US07: URL fetching and pasted-text ingestion

**User Story**: As the owner, I want to paste text or a URL in the chat and have the companion propose saving it to the brain so that ingestion stays effortless.

**Acceptance Criteria**:
- [ ] `HttpSourceFetcher` implements `SourceFetcher`:
  - [ ] http(s) only
  - [ ] blocks private and loopback addresses (SSRF)
  - [ ] has a timeout and a size cap
  - [ ] extracts the title and readable text into Markdown
- [ ] A `fetch_source` tool (read-only, no approval) returns the extracted text for the agent to summarize
- [ ] Pasted text ingests with `source.kind = "text"`; URLs with `source.kind = "url"`, keeping the original URL in the raw file's frontmatter
- [ ] The agent proposes (Karpathy trigger B: propose, then confirm) and never writes unprompted without approval
- [ ] Adapter tests use msw; fetcher coverage is at least 95%

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Adapters | Fetcher | `packages/adapters/src/http-source-fetcher/*` |
| Agent | Tool, container wiring | `agents/companion/agent/tools/fetch_source.ts`, `container.ts` |
| Evals | Ingest-from-URL flow | `agents/companion/evals/flows/ingest-url.eval.ts` |
| E2E | Paste and approve | `e2e/tests/brain/ingest.spec.ts` |

**Dependencies**: E3-US05

**Complexity**: M

**Status**: Pending

**Test Scenarios**:
```gherkin
Scenario: Ingest a URL
  Given I paste https://example.com/post
  When the agent proposes write_page and I approve
  Then raw/<date>-<slug>.md contains the extracted text and the URL

Scenario: SSRF blocked
  When fetch_source is called with http://169.254.169.254/
  Then it returns a blocked-address error
```
