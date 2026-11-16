# E3-US07: URL fetching and pasted-text ingestion

**User Story**: As the owner, I want to paste text or a URL in the chat and have the companion save it to the brain so that ingestion stays effortless.

**Acceptance Criteria**:
- [x] `SourceUrl` (domain) accepts http(s) URLs only, without credentials, and refuses `localhost` and literal private, loopback, link-local, and reserved addresses with a `BlockedAddressError` (SSRF)
- [x] `HttpSourceFetcher` implements `SourceFetcher`:
  - [x] resolves the host and refuses it when any address is blocked, again on every redirect hop, and connects only to the checked addresses (no DNS rebinding)
  - [x] has a timeout and a size cap
  - [x] accepts HTML, plain text, and Markdown only
  - [x] extracts the title and readable text into Markdown
- [x] `InMemorySourceFetcher` is its twin; `SOURCE_FETCHER=memory` selects it for evals and E2E, so they never reach the network
- [x] A `fetch_source` tool (read-only, no approval) returns the extracted text for the agent to save or summarize
- [x] Pasted text ingests with origin `pasted`; a URL ingests with the URL as origin, kept in the raw file's frontmatter
- [x] Saving a source whose raw name is taken (same title, same day) gets the next free number instead of failing
- [x] When the person asks to keep a URL or pasted text, the agent saves it without approval (ADR-0011) and says what it saved and where; it never saves content nobody asked to keep
- [x] Adapter tests use msw; fetcher coverage is at least 95%

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Domain | URL policy, fetch use-case | `packages/domain/src/wiki/entities/source-url.ts`, `packages/domain/src/wiki/use-cases/fetch-source.ts` |
| Adapters | Fetcher and twin | `packages/adapters/src/http-source-fetcher/*`, `packages/adapters/src/in-memory-source-fetcher/*` |
| Agent | Tool, container wiring, instructions | `agents/companion/agent/tools/fetch_source.ts`, `container.ts`, `instructions.md` |
| Evals | Ingest-from-URL flow | `agents/companion-test/evals/flows/ingest-url.eval.ts` |
| E2E | Paste a URL and see it saved | `e2e/tests/chat/ingest.spec.ts` |

**Dependencies**: E3-US05

**Complexity**: M

**Status**: Done

**Test Scenarios**:
```gherkin
Scenario: Ingest a URL
  Given I paste https://example.com/post and ask to save it
  When the agent calls fetch_source, then write_page
  Then raw/<date>-<slug>.md contains the extracted text and the URL as origin
  And the reply says what was saved and where

Scenario: SSRF blocked
  When fetch_source is called with http://169.254.169.254/
  Then it returns a BlockedAddressError result
```
