# ADR-0010: Direct Anthropic model routing on the owner's key

## Status

Accepted (2026-11-14)

## Context

eve routes a model ID string such as `"anthropic/claude-sonnet-5.5"` through Vercel AI Gateway. Gateway bills through Vercel and authenticates with `VERCEL_OIDC_TOKEN` or `AI_GATEWAY_API_KEY`. The owner wants to pay for tokens on their own Anthropic account (E2-US02).

eve ships `anthropic(model?)` in `eve/models/anthropic`. It calls the Anthropic API directly and reads `ANTHROPIC_API_KEY`. Deployments get no local secret-store fallback, so the key must be in the server env (`node_modules/eve/docs/agent-config.md`, "Set the model").

eve turns on prompt caching automatically for Anthropic models it recognizes (`agent-config.md`, "Prompt caching"). We measured it with `evals/prompt-caching.eval.ts`. On the second turn, the trace showed ~6.8K input tokens and ~6.8K of them read from cache. No extra config is needed.

## Decision

- Agents use **direct provider model instances** (`anthropic("claude-sonnet-5-5")`), not Gateway model ID strings.
- `ANTHROPIC_API_KEY` lives in Vercel production and preview as a sensitive variable, and locally in the root `.env.local` (gitignored). It never goes into source, prompts, tool inputs or tool results.
- Prompt caching stays on eve's default (5-minute TTL). Switch to `modelOptions.promptCache: { anthropic: { ttl: "1h" } }` only if measurements show that cache reads after 5 minutes outweigh the 2x write price.
- The eval judge uses `anthropic.decisionModel("claude-haiku-5-5")` from `@ai-sdk/anthropic` (dev dependency), so evals need no Gateway either.

## Consequences

### Positive
- Billing and rate limits are on the owner's Anthropic account.
- Local dev, evals and deployments all use the same key and path.

### Negative
- No Gateway failover, observability or provider routing.
- A missing key fails each turn with `MODEL_CALL_FAILED`. eve doesn't fail at boot, so a bad key only shows up on the first turn. Run the smoke eval against a deployment (`eve eval smoke --url <app>/eve/companion` from `agents/companion/`) after changing env vars.

## Alternatives Considered
- **AI Gateway with a model string**: no key to manage and built-in failover, but billing goes through Vercel instead of the owner's account.
- **AI Gateway with BYOK**: Gateway features with the owner's key, but adds a layer to configure and debug before there's a need for it.
