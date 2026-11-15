---
name: scaffold
description: Scaffold cortex building blocks the house way — domain port + use-case, adapter + in-memory twin, thin eve tool, container wiring, and FSD web slice — each with colocated tests.
---

Always write the test first (see `add-unit-tests`). Read `adr/0002-*` (hexagonal) and `adr/0003-*` (FSD) before deviating.

## 1. Domain port + use-case — `packages/domain/src/<context>/`

Zero imports outside `@cortex/domain`. No eve, no zod, no Node APIs.

```ts
// packages/domain/src/wiki/ports/WikiStore.ts
export interface WikiStore {
  readFile(path: string): Promise<string | null>;
  listPages(): Promise<PagePath[]>;
  commit(changeset: Changeset, message: string): Promise<CommitRef>;
}

// packages/domain/src/wiki/use-cases/ReadPage.ts
export class ReadPage {
  constructor(private readonly store: WikiStore) {}
  async execute(path: PagePath): Promise<Page> {
    const content = await this.store.readFile(path.value);
    if (content === null) throw new PageNotFoundError(path);
    return Page.parse(path, content);
  }
}
```

- Errors are domain classes (`PageNotFoundError extends DomainError`), never strings.
- Export from the context barrel and `packages/domain/src/index.ts`.
- Test with a hand-written fake or the in-memory adapter's logic duplicated as a stub — 100% coverage required.

## 2. Adapter + in-memory twin — `packages/adapters/src/<name>/`

```
packages/adapters/src/
  github-wiki-store/GitHubWikiStore.ts        implements WikiStore
  github-wiki-store/GitHubWikiStore.test.ts   msw fakes the GitHub HTTP API
  in-memory-wiki-store/InMemoryWikiStore.ts   implements WikiStore (tests + local dev)
  in-memory-wiki-store/InMemoryWikiStore.test.ts
```

- Every port gets an in-memory twin; both run the **same contract test** (`describeWikiStoreContract(factory)`) so they can't drift.
- Credentials arrive through the constructor (`new GitHubWikiStore({ token, owner, repo })`); adapters never read `process.env`.
- Import heavy SDKs inside methods to keep the eve bundle small.

## 3. Thin eve tool — `agents/<agent>/agent/tools/<tool_name>.ts`

The filename is the tool name the model sees (snake_case). A tool only: validates input (zod) → calls one use-case → maps domain errors to model-friendly output. No business logic.

```ts
import { defineTool } from "eve/tools";
import { z } from "zod";
import { container } from "../container";

export default defineTool({
  description: "Create or update a wiki page.",
  inputSchema: z.object({ path: z.string(), content: z.string() }),
  // Brain writes take no approval (ADR-0011); a side effect outside the brain needs `approval: always()`.
  async execute(input) {
    try {
      return await container().applyIngest.execute(input);
    } catch (error) {
      if (error instanceof DomainError) return { error: error.message };
      throw error;
    }
  },
});
```

Rules: tools never receive or return secrets; brain tools stay narrow (no generic GitHub/HTTP tools); read eve's `node_modules/eve/docs/tools/index.mdx` for `toModelOutput`, approvals, and `ctx`.

## 4. Composition root — `agents/<agent>/agent/container.ts`

The only place adapters are chosen. Picks in-memory adapters when brain env vars are absent (local dev, evals), GitHub adapters otherwise. Memoize per process; read `process.env` here and nowhere else in the agent.

## 5. FSD web slice — `apps/web/src/features/<feature>/`

```
features/chat/
  api.ts              types + constants (agent name), no React
  hooks/useX.ts       one hook per file; owns state/effects (+ useX.test.ts)
  widgets/X.tsx       props only, zero hooks; may compose components/ui + components/ai-elements (+ X.test.tsx)
  ui/XScreen.tsx      wires hooks + widgets (+ XScreen.test.tsx integration)
  index.ts            barrel
```

- `app/**/page.tsx` renders a `ui/` component and nothing else.
- Imports: routes → feature barrels → `lib/`. Never feature → feature, never `lib/` → features.
- `components/ui` and `components/ai-elements` are vendored: don't edit them; wrap them in widgets.
- Every interactive element gets `data-testid="{page}-{type}-{name}"`.
