# E7-US03: Follow the agent in the brain panel

**User Story**: As a user, I want the brain panel to follow companion from page to page while it answers so that I can read where it is instead of squinting at the whole brain.

**Acceptance Criteria**:

- [x] While a turn runs, each new step glides the panel's view to that page at a readable zoom, easing between hops
- [x] A page the agent just wrote is followed as soon as the graph has placed it, but never after the turn has eased out
- [x] About a second after the turn ends, the view eases back out to the whole brain
- [x] Panning, zooming or dragging pauses following for the rest of the turn; the next turn follows again
- [x] A "Following" toggle over the graph shows whether the view follows the agent right now (off, or paused by a hand move) and turns it off and on; turning it on goes back to the latest step
- [x] The full `/brain` view is unchanged

**Technical Tasks**:

| Layer | Task | File(s) |
| ----- | ---- | ------- |
| Web | Glide, animated fit, `userMoved` in the viewport | `apps/web/src/features/brain-graph/hooks/use-graph-viewport.ts` |
| Web | Follow the latest step, ease out after the turn | `apps/web/src/features/brain-graph/hooks/use-follow-agent.ts` |
| Web | Follow toggle, `busy` (a turn is open) from the chat | `apps/web/src/features/brain-graph/{widgets/brain-follow-button.tsx,ui/brain-trail-preview.tsx}`, `apps/web/app/_components/agent-chat.tsx` |
| E2E | Following on by default, toggle | `e2e/tests/brain/trail.spec.ts` |

**Dependencies**: E7-US02

**Complexity**: S

**Status**: Done

**Test Scenarios**:

```gherkin
Scenario: The panel follows the agent
  Given I'm in the chat
  When I send "walk brain"
  Then the brain panel is following the agent

Scenario: Turning following off
  Given the brain panel is following the agent
  When I click the follow toggle
  Then the panel stops following
```
