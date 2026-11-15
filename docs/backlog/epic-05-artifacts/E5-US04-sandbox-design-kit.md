# E5-US04: Sandbox and shadcn design kit

**User Story**: As the companion, I want a sandbox with the design system's tokens, recipes, and a template so that every artifact I write looks like the web app.

**Acceptance Criteria**:

- [x] `agent/sandbox.ts` uses the default provider (Vercel in production, just-bash locally) and writes the design kit into `design/` when a session opens it
- [x] The kit has `theme.css` (the web app's tokens, light and dark), `components.md` (new-york class recipes for button, card, badge, table, tabs, input, alert, separator), and `template.html`
- [x] A test fails when the kit's tokens drift from `apps/web/app/globals.css`
- [x] An `artifacts` skill explains the workflow: write `artifacts/<slug>/index.html`, edit it in place, publish after every change

**Technical Tasks**:

| Layer | Task | File(s) |
| ----- | ---- | ------- |
| Agent | Sandbox definition | `agents/companion/agent/sandbox.ts` |
| Agent | Design kit | `agents/companion/agent/lib/design-kit.ts` |
| Agent | Skill | `agents/companion/agent/skills/artifacts/SKILL.md` |

**Dependencies**: E5-US03

**Complexity**: M

**Status**: Done

**Test Scenarios**:

```gherkin
Scenario: Tokens stay in sync
  Given the web app's globals.css
  Then every token in the kit's theme.css has the same value in light and dark
```
