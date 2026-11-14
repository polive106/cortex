# E4-US02: Mentions and DMs

**User Story**: As a Slack user, I want to @mention the companion in a channel or DM it so that I can ask questions answered from the brain without leaving Slack.

**Acceptance Criteria**:
- [ ] It replies in-thread when @mentioned in a channel and directly in DMs; it ignores channel messages without a mention
- [ ] Brain citations render as Slack links to the GitHub page
- [ ] Each Slack thread maps to one eve session (follow-ups keep context)
- [ ] An eval or integration test covers message → reply mapping with eve's Slack test utilities, if eve provides them

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Agent | Channel config and formatting | `agents/companion/agent/channels/slack.ts` |
| Evals | Slack flow | `agents/companion/evals/flows/slack-mention.eval.ts` |

**Dependencies**: E4-US01

**Complexity**: S

**Status**: Pending

**Test Scenarios**:
```gherkin
Scenario: Mention in channel
  Given the companion is in #general
  When someone posts "@companion when do we deploy?"
  Then it replies in that thread citing wiki/deploys.md

Scenario: No mention
  When someone posts in #general without a mention
  Then the companion does not reply
```
