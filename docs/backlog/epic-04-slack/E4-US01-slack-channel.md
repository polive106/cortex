# E4-US01: Slack channel via Vercel Connect

**User Story**: As the owner, I want the companion installed in my Slack workspace through eve's native Slack channel so that teammates can reach it where they already talk.

**Acceptance Criteria**:
- [ ] The Slack integration is found with `eve registry search slack` and installed with `eve add <item> --agent companion --non-interactive`
- [ ] The Slack sign-in (`vercel connect create slack`) is done by the owner in the browser; no Slack secrets are committed
- [ ] The Slack channel's auth maps a Slack user to a principal; non-allowlisted users get a polite refusal if approvers are restricted
- [ ] An ADR records the Slack decisions (workspace, approvers, channel scope)

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Agent | Slack channel | `agents/companion/agent/channels/slack.ts` |
| Docs | ADR, env/setup docs | `adr/NNNN-slack-channel.md`, `AGENTS.md` |

**Dependencies**: E3-US09

**Complexity**: M

**Status**: Pending

**Test Scenarios**:
```gherkin
Scenario: Installed
  Given the Slack app is installed
  When I DM the companion "hi"
  Then it replies in the DM
```
