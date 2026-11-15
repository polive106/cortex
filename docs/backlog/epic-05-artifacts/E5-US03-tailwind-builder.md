# E5-US03: Tailwind artifact builder and artifact listing

**User Story**: As the companion, I want the Tailwind classes an artifact uses compiled into its page so that it looks like shadcn anywhere, with no network.

**Acceptance Criteria**:

- [ ] `TailwindArtifactBuilder` compiles only the candidates found in the HTML with Tailwind v4's `compile()`, on the design kit's theme, minus fonts that need the network
- [ ] Tailwind's base CSS is embedded as a module, and a test fails when it drifts from the installed `tailwindcss`
- [ ] An in-memory twin for tests and flow evals; both pass a shared `ArtifactBuilder` contract
- [ ] `listArtifacts()` and `readFile(path, ref)` on the in-memory, read-only, and GitHub stores, in the shared `WikiStore` contract
- [ ] 95% coverage

**Technical Tasks**:

| Layer | Task | File(s) |
| ----- | ---- | ------- |
| Adapters | Tailwind builder + embedded base CSS | `packages/adapters/src/tailwind-artifact-builder/` |
| Adapters | Twin | `packages/adapters/src/in-memory-artifact-builder/` |
| Adapters | Store additions | `packages/adapters/src/{in-memory,read-only,github}-wiki-store/` |
| Adapters | Contracts | `packages/adapters/src/contracts/` |

**Dependencies**: E5-US02

**Complexity**: M

**Status**: Pending

**Test Scenarios**:

```gherkin
Scenario: Only used classes
  When the builder gets HTML using "bg-primary p-4"
  Then the CSS has those utilities and the shadcn tokens, and no unused utility

Scenario: Old version
  Given two commits to out/a.html
  When readFile is called with the first commit's ref
  Then it returns the first version
```
