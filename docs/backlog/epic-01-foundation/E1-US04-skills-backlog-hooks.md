# E1-US04: Skills, backlog, and doc-sync hooks

**User Story**: As a coding agent, I want repeatable workflows (skills) and a structured backlog guarded by hooks so that I always know what to build next and how.

**Acceptance Criteria**:
- [x] `.agents/skills/` contains `commit`, `story-complete`, `create-story`, `review-backlog`, `discuss-feature`, `scaffold`, `add-unit-tests`, `add-e2e-tests`, `review`, `debug`, `fix-ci`, `add-adr`, `add-eval`
- [x] `.claude/skills` is a symlink to `../.agents/skills`
- [x] `docs/backlog/` has the PRD README and epics E1–E4 with stories in the standard format
- [x] Claude Code hooks ported from ProtoPal:
  - [x] story format validation
  - [x] backlog index sync
  - [x] story status sync
  - [x] `AGENTS.md`/`CLAUDE.md` skills sync
  - [x] backlog drift check at session start

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Skills | Port and adapt the skills | `.agents/skills/*/SKILL.md` |
| Backlog | PRD and epics | `docs/backlog/**` |
| Claude Code | Doc-sync hooks | `.claude/hooks/*.sh`, `.claude/settings.json` |

**Dependencies**: E1-US03

**Complexity**: M

**Status**: Done

**Test Scenarios**:
```gherkin
Scenario: Malformed story is flagged
  Given a story file missing "**Test Scenarios**"
  When it is written
  Then the validate-story-format hook lists the missing section

Scenario: Status drift is flagged
  Given a story file says Done and its epic README says Pending
  When a session starts
  Then the drift hook reports the mismatch
```
