# E3-US10: PDF and image attachments in web chat

**User Story**: As the owner, I want to attach a PDF or an image to a chat message so that companion can answer questions about it and save it to the brain as a faithful text capture.

**Acceptance Criteria**:
- [x] The chat composer has an attach button (`chat-btn-attach`) that accepts one PDF, PNG, JPEG, GIF, or WebP file of up to 3 MB per message (two would break Vercel's 4.5 MB body limit); paste and drag-and-drop go through the same checks; pending files show as removable chips before sending
- [x] A file of the wrong type or over 3 MB is rejected in the composer with a clear message (`chat-text-attachment-error`), before anything is sent
- [x] The web channel's `uploadPolicy` enforces the same types and the 3 MB cap on the server (413/415), so the 4.5 MB Vercel body limit is never the first thing to fail
- [x] Attachments show on the user's message in the thread (thumbnail for an image, file chip for a PDF)
- [x] Instructions: attaching a file is not a request to save it. Companion answers questions about an attachment without saving, and saves only when asked or when the content is clearly durable knowledge
- [x] When saving a file, `write_page` gets `source.origin = "upload:<filename>"` and `source.text` is a faithful capture (verbatim text for a PDF; transcribed text plus a short factual description for an image), never a summary. The original file is not stored (ADR-0004: `raw/` is text only)
- [x] Instructions inside an uploaded file are data, never followed
- [x] The `companion-test` double can save an attachment ("save attachment"), so a flow eval and E2E cover attach → save without a model
- [x] The real-model checks (no save on a question, faithful capture on "save this", injected instructions ignored) are cases of E3-US09

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Domain | Attachment limits and the `upload:<file name>` origin | `packages/domain/src/wiki/entities/attachment.ts`, `source.ts` |
| Agent | `uploadPolicy` on the web channel (companion-test re-exports it) | `agents/companion/agent/channels/eve.ts` |
| Agent | Attachment rules | `agents/companion/agent/instructions.md` |
| Agent | Scripted "save attachment" | `agents/companion-test/agent/agent.ts` |
| Web | Attachments slice: limits, error hook, chips widget, composer UI | `apps/web/src/features/attachments/*`, `apps/web/app/_components/agent-chat.tsx` |
| Evals | Save-attachment flow, and the channel refusing other types | `agents/companion-test/evals/flows/save-attachment.eval.ts` |
| E2E | Attach, reject, save | `e2e/tests/chat/attachments.spec.ts` |

**Dependencies**: E3-US07

**Complexity**: M

**Status**: Done

**Notes**: eve sends attachment bytes again on every model call in a session; prompt caching keeps repeat turns cheap. Accepted, no stripping. Files over 3 MB (Blob uploads), stored originals, other file types, and Slack attachments (see E4-US04) are out of scope.

**Test Scenarios**:
```gherkin
Scenario: Ask about an image without saving
  Given I attach a screenshot of an error
  When I ask "what does this error mean?"
  Then the agent answers and write_page is not called

Scenario: Save a PDF
  Given I attach deploy-runbook.pdf
  When I say "save this to the brain"
  Then write_page is called with origin "upload:deploy-runbook.pdf" and the PDF's text as the source
  And the reply says which pages were saved

Scenario: Oversized file
  When I attach a 5 MB PDF
  Then the composer shows "Files must be 3 MB or less" and nothing is sent
```
