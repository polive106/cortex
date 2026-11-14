# ADR-0002: Lightweight hexagonal architecture over eve

## Status

Accepted (2026-11-14)

## Context

The agent's business logic (reading, searching, and merging the knowledge wiki) must be testable without eve, GitHub, a network, or a model. Storage will likely change (GitHub today, maybe a GitHub App or another store later), and more agents will share the same logic.

## Decision

Ports and adapters, kept lightweight:

1. **`@cortex/domain`** (`packages/domain`): entities, value objects, port interfaces, and use-cases. **Zero external dependencies.** Use-cases are classes with an `execute()` method that receive ports through the constructor.
2. **`@cortex/adapters`** (`packages/adapters`): implementations of domain ports (e.g. `GitHubWikiStore`, `InMemoryWikiStore`, `HttpSourceFetcher`). Every port gets an in-memory twin for tests and local dev.
3. **eve agents** (`agents/<name>/agent/`): eve tools are the "controllers". They validate input (zod), call one use-case, and map domain errors to tool results. Wiring happens in a composition root (`agent/container.ts`) that selects adapters from the environment.

**Dependency direction:** domain ← adapters ← agents. Enforced by Biome `noRestrictedImports` overrides in `biome.json`.

No event buses, CQRS, or aggregate roots.

## Consequences

### Positive
- The domain is tested with plain in-memory fakes, fast enough for every commit.
- Swapping GitHub for another store only touches `@cortex/adapters`.
- Several agents can reuse the same use-cases.

### Negative
- More indirection than putting logic straight into eve tools.
- Even small features need port → adapter → use-case → tool.

## Alternatives Considered
- **Logic inside eve tools**: fastest initially, but couples business rules to the framework and makes them hard to test without a model.
- **Full DDD**: too heavy for the current scale.
