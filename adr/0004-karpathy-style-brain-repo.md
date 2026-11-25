# ADR-0004: Karpathy-style LLM wiki in a separate GitHub repo

## Status

Accepted (2026-11-14). Amended by 0011 (writes no longer need approval).

## Context

Agents need a shared, durable knowledge base that people can read and correct. eve's built-in memory is a bounded document per scope (64 KB maximum) meant for facts and preferences, not a knowledge base.

## Decision

The **brain** is a Markdown wiki following Karpathy's "LLM Wiki" pattern, in its own **private GitHub repo** (`BRAIN_REPO`):

- `AGENTS.md`: the schema and conventions the agent follows.
- `index.md`: a catalog of every page with a one-line summary.
- `log.md`: an append-only record of ingests, queries, and lints.
- `raw/YYYY-MM-DD-<slug>.md`: immutable text captures of sources.
- `wiki/**/*.md`: pages maintained by the LLM, with cross-links and links back to `raw/`.

How the agent uses it:
- **Query:** `AGENTS.md` and `index.md` are recalled every turn (custom eve memory provider). Pages are opened on demand through tools. Answers cite pages.
- **Ingest:** the agent proposes saving, and the user approves (eve tool approval on `write_page`). An approved ingest *merges* into existing pages instead of appending. Each ingest is **one commit** containing the raw source, the pages, `index.md`, and `log.md`.
- **Lint:** later, a scheduled health check.

The brain lives in a **separate repo**, not in cortex.

## Consequences

### Positive
- Humans can browse and edit it anywhere (GitHub, Obsidian), and git history is the audit log.
- Brain commits never trigger cortex deploys, and the brain token can't modify agent code.
- The brain outlives this codebase and can be shared by any agent.

### Negative
- Search starts naive (index plus grep). A semantic index will be needed if the wiki grows large.
- Raw captures put full source text into GitHub, so the repo must stay private.

## Alternatives Considered
- **A `wiki/` folder in cortex**: every ingest would redeploy the app, and the token could write agent code.
- **Vercel Blob**: no history, diffs, or human editing.
- **Notion or Drive through MCP**: less predictable formats and API dependence.
- **Supermemory or other semantic memory**: opaque, and can't be read or corrected as a wiki.
