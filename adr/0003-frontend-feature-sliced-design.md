# ADR-0003: Feature Sliced Design on Next.js with the vendored eve UI

## Status

Accepted (2026-11-14)

## Context

The web app (`apps/web`) is a test chat UI for agents. `eve add channel/web` scaffolds a Next.js app with shadcn/ui (new-york, neutral, lucide), AI Elements (`conversation`, `message`, `tool`, `prompt-input`, `code-block`), eve components (`trace`, `questionnaire`), and inline approval rendering. Its chat logic lives in `app/_components/`, which doesn't follow our structure.

## Decision

1. Scaffold with `eve add channel/web --agent companion`.
2. Treat `components/ui/**` and `components/ai-elements/**` as **vendored**: no edits, excluded from coverage. Update them via shadcn/eve tooling.
3. Move app logic into **feature slices** under `src/features/<feature>/`:
   - `api.ts`: types and the agent name.
   - `hooks/`: all state, effects, and `useEveAgent` calls. One hook per file.
   - `widgets/`: stateless, props-only components that compose vendored components. No hooks.
   - `ui/`: wires hooks and widgets together.
   - `index.ts`: the barrel.
4. `app/` routes stay thin: render a `ui/` component and nothing else.
5. **Import rules:** routes → features (through barrels only) → `lib/`. Never features → routes, `lib/` → features, or feature → feature.
6. Tests are colocated with their source (no `__tests__/` directories).

## Consequences

### Positive
- Keeps eve's design and approval UX without maintaining a design system.
- Each layer is testable on its own: hooks with `renderHook`, widgets with props, `ui/` as integration.

### Negative
- An initial restructure of the scaffold.
- Upstream scaffold improvements must be merged into our slices by hand.

## Alternatives Considered
- **Keep the scaffold as is**: faster, but `AGENTS.md` would need exceptions, which agents exploit.
- **Hand-written UI on plain shadcn**: discards working approval and trace UI.
- **A shared `@cortex/design-system` package**: premature with a single app.
