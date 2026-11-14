# E2-US03: Web channel scaffold and FSD restructure

**User Story**: As the owner, I want a web chat to test the companion that is built on eve's ready-made UI but organized by our FSD rules, so that it becomes the reference for every future feature.

**Acceptance Criteria**:
- [x] `eve add channel/web --agent companion` scaffolds `apps/web` (Next.js), hosted as Vercel services through the root `vercel.ts`
- [x] Vendored `components/ui` (shadcn) and `components/ai-elements` are untouched and excluded from coverage and lint
- [ ] The chat logic moves into `apps/web/src/features/chat/`:
  - [ ] `api.ts`
  - [ ] `hooks/useCompanionChat.ts`, wrapping `useEveAgent({ agent: "companion" })`
  - [ ] `widgets/` (`MessageList`, `Composer`), props only
  - [ ] `ui/ChatScreen.tsx`
  - [ ] `index.ts`
- [ ] `app/page.tsx` only renders `ChatScreen`
- [ ] Every interactive element has a `data-testid`
- [ ] Web feature coverage is at least 90%; Biome enforces the FSD import rules
- [x] `pnpm dev:all` runs the web app and the agent together locally

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Web | Scaffold | `apps/web/**`, `vercel.ts` |
| Web | Chat slice | `apps/web/src/features/chat/**` |
| Web | Thin route | `apps/web/src/app/page.tsx` |
| Tooling | Vitest and coverage config for web, Biome overrides | `apps/web/vitest.config.ts`, `biome.json` |

**Dependencies**: E2-US01

**Complexity**: L

**Status**: Done

**Note (2026-11-14)**: the owner chose to skip the FSD restructure for now. The unchecked items above (the `features/chat/` slice, the thin route, `data-testid` on every element, web coverage, and the Biome FSD rules) are deferred to a follow-up story. The app ships as eve generated it, under `apps/web/app/_components/`. eve's installer runs `pnpm add` at the workspace root, so it needs `npm_config_ignore_workspace_root_check=true`.

**Test Scenarios**:
```gherkin
Scenario: Send a message
  Given the chat screen
  When I type "hello" and press send
  Then my message and a streamed agent reply appear

Scenario: Widget purity
  Given MessageList rendered with messages as props
  Then it renders them without any provider or hook
```
