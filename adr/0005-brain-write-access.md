# ADR-0005: Brain write access: fine-grained token, commits to main

## Status

Accepted (2026-11-14). Amended by 0011 (writes no longer need approval).

## Context

Agents must read and write the brain repo (ADR-0004). Options included a fine-grained personal access token, a GitHub App, or eve's GitHub Tools extension through Vercel Connect.

## Decision

- A **fine-grained personal access token** restricted to `polive106/brain` with **Contents: read and write**, stored as the server-side env var `BRAIN_GITHUB_TOKEN`. The model never sees it.
- Agents get only **narrow wiki tools** (`list_pages`, `read_page`, `search_wiki`, `write_page`), hard-wired to that repo through the `WikiStore` port. No general GitHub tools.
- Approved writes are committed **straight to `main`**. `git revert` is the undo.

## Consequences

### Positive
- Five-minute setup. The worst case is wrong Markdown in one repo.
- The auth method is hidden behind the adapter, so moving to a GitHub App only changes how the token is obtained.

### Negative
- Commits are attributed to the token owner, not a bot.
- The token expires and must be rotated (set a calendar reminder).
- No review step before content lands, which is acceptable while one person approves every write in the UI.

## Alternatives Considered
- **GitHub App installed on the brain repo only**: bot attribution and short-lived tokens. The planned upgrade once more people use it.
- **eve GitHub Tools extension**: per-user Vercel Connect sign-in by default, and a broader surface than a wiki needs.
- **A PR per ingest**: friction a single user would stop doing. Revisit when a team feeds the brain.
