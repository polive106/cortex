# E5-US07: Artifact flow evals and E2E

**User Story**: As a developer, I want the artifact flow covered end to end so that publishing, revising, and previewing can't silently break.

**Acceptance Criteria**:

- [ ] companion-test scripts "make artifact <slug>" and "revise artifact <slug>" (write the file, then publish)
- [ ] Flow evals: publish then revise gives versions 1 and 2; a missing file is reported
- [ ] Playwright: the panel opens with the page in the frame, a revision shows version 2, and picking version 1 shows the first page

**Technical Tasks**:

| Layer | Task | File(s) |
| ----- | ---- | ------- |
| Agent | Test double scripts and tool re-exports | `agents/companion-test/agent/` |
| Evals | Flow evals | `agents/companion-test/evals/flows/artifacts.eval.ts` |
| E2E | Panel spec | `e2e/tests/chat/artifacts.spec.ts`, `e2e/fixtures/chat.ts` |

**Dependencies**: E5-US06

**Complexity**: M

**Status**: Pending

**Test Scenarios**:

```gherkin
Scenario: Publish and revise
  When I send "make artifact demo" then "revise artifact demo"
  Then the panel shows version 2, and version 1 is still selectable
```
