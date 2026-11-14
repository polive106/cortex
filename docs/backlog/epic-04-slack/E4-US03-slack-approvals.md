# E4-US03: Approvals in Slack

**User Story**: As an approver, I want `write_page` approvals shown in Slack with Approve and Deny buttons so that saving knowledge doesn't require opening the web UI.

**Acceptance Criteria**:
- [ ] A pending `write_page` approval renders in the thread with the page paths, the reason, and Approve/Deny buttons
- [ ] Only allowed approvers (per the E4 decision) can approve; others see an ephemeral "not allowed"
- [ ] After approval, the thread shows the commit link; after denial, an acknowledgement
- [ ] A flow eval covers park → approve → commit through the Slack channel path

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Agent | Approval rendering and approver policy | `agents/companion/agent/channels/slack.ts`, `agents/companion/agent/tools/write_page.ts` |
| Domain | Approver policy (pure) | `packages/domain/src/auth/canApprove.ts` |

**Dependencies**: E4-US02

**Complexity**: M

**Status**: Pending

**Test Scenarios**:
```gherkin
Scenario: Allowed approver
  Given a pending write_page approval in a thread
  When the owner clicks Approve
  Then one commit lands in the brain and the thread shows its link

Scenario: Non-approver
  When another user clicks Approve
  Then they see "not allowed" and nothing is written
```
