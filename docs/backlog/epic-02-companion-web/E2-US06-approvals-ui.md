# E2-US06: Approvals UI hook and widget

**User Story**: As the owner, I want pending tool approvals shown clearly in the chat with approve and deny buttons so that "agent proposes, I confirm" is fast and unmistakable.

**Acceptance Criteria**:
- [ ] `hooks/useApprovals.ts` reads pending interactions (`openInteractions(view)`) and exposes `approve(id)` and `deny(id)` using `respond()`
- [ ] `widgets/ApprovalCard.tsx` (props only) shows the tool, a human summary of the input (e.g. page path and reason), and approve/deny buttons with `data-testid`s
- [ ] Approved and denied states render; the composer shows that the agent is waiting while an approval is open
- [ ] It's tested with a demo tool that has `approval: always()` in the mock test agent (the real brain tools arrive in E3)
- [ ] Unit, integration, and E2E coverage for approve and deny

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Web | Hook, widget, wiring | `apps/web/src/features/chat/hooks/useApprovals.ts`, `widgets/ApprovalCard.tsx`, `ui/ChatScreen.tsx` |
| Evals | Approval park and resume flow | `agents/companion/evals/flows/approval.eval.ts` |
| E2E | Approve and deny | `e2e/tests/chat/approvals.spec.ts` |

**Dependencies**: E2-US05

**Complexity**: M

**Status**: Pending

**Test Scenarios**:
```gherkin
Scenario: Approve
  Given the agent calls a tool requiring approval
  When I click chat-btn-approve
  Then the tool runs and the agent continues

Scenario: Deny
  When I click chat-btn-deny
  Then the tool does not run and the agent acknowledges the denial
```
