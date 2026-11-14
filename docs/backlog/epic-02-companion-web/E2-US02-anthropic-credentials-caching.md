# E2-US02: Anthropic credentials and prompt caching verification

**User Story**: As the owner paying for tokens, I want the companion to use my Anthropic API key with prompt caching on so that repeated context (instructions, brain schema, index) costs much less.

**Acceptance Criteria**:
- [x] How eve routes `anthropic/*` models with an `ANTHROPIC_API_KEY` (direct or through AI Gateway) is documented, from the eve docs and a verified run
- [x] `ANTHROPIC_API_KEY` is set in Vercel (production and preview) and in a local `.env.local` (gitignored), never committed
- [x] Prompt caching is verified: a second turn shows cached input tokens in eve's usage events or traces
- [x] If caching is off by default, the agent config enables it and an ADR records how (it's on by default; ADR-0010 records direct routing and the measured cache hit)
- [x] `AGENTS.md` lists the required environment variables

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Agent | Credential and caching config | `agents/companion/agent/agent.ts` |
| Docs | Env var table, ADR if a decision is made | `AGENTS.md`, `adr/` |

**Dependencies**: E2-US01

**Complexity**: S

**Status**: Done

**Test Scenarios**:
```gherkin
Scenario: Cached second turn
  Given a session with one completed turn
  When I send a second message
  Then usage reports cache-read input tokens greater than 0

Scenario: Missing key
  Given ANTHROPIC_API_KEY is unset in production
  When a turn starts
  Then the error is reported without leaking configuration
```
