# E4-US04: "Save this thread" ingestion

**User Story**: As a Slack user, I want to say "@companion save this thread" so that the decisions in a discussion land in the brain with the thread as the source.

**Acceptance Criteria**:
- [ ] The companion reads the current thread's messages (read-only Slack access, current thread only)
- [ ] The raw source is saved as `raw/YYYY-MM-DD-slack-<channel>-<slug>.md` with participants shown as display names (no emails)
- [ ] It proposes page creates or updates through the normal `write_page` approval
- [ ] Threads from private channels need explicit confirmation before saving
- [ ] Images and PDFs attached in the thread are captured as text in the raw source, as in the web chat (E3-US10); originals are not stored
- [ ] Unit tests for thread-to-Markdown conversion; a flow eval for the propose → approve path

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Domain | Thread to Source conversion | `packages/domain/src/wiki/sources/slackThread.ts` |
| Agent | `read_thread` tool | `agents/companion/agent/tools/read_thread.ts` |
| Evals | Save-thread flow | `agents/companion/evals/flows/save-thread.eval.ts` |

**Dependencies**: E4-US03

**Complexity**: M

**Status**: Pending

**Test Scenarios**:
```gherkin
Scenario: Save a decision thread
  Given a thread where the team decides to deploy on Thursdays
  When someone says "@companion save this thread"
  Then the agent proposes updating wiki/deploys.md with the thread as a raw source
```
