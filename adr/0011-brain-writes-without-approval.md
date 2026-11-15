# ADR-0011: Brain writes without approval

## Status

Accepted (2026-11-15). Amends ADR-0004 and ADR-0005.

## Context

ADR-0004 and ADR-0005 made every brain write wait for a human to approve the `write_page` call. In use, approving every save is friction the owner doesn't want, and HTML artifacts (ADR-0012) make it worse: a new version is published after every change in the conversation. Every write is already one commit straight to `main`, so `git revert` undoes any of them.

## Decision

- Brain writes (`write_page`, `publish_artifact`) run **without approval**. No brain tool sets `approval`.
- Everything else from ADR-0004 and ADR-0005 stays: narrow tools only, paths validated by `PagePath` and `ArtifactPath`, one commit per write, the never-store-secrets rule, the token server-side.
- Every write is reported in the reply (what was saved and where), so the person sees it and can ask for a revert.
- Tools with side effects outside the brain still need approval.

## Consequences

### Positive
- Saving and iterating cost no clicks.
- One approval code path fewer for brain tools.

### Negative
- No human looks at a write before it lands. Content injected through a fetched page or pasted text (E3-US07) can now reach the brain unreviewed. The damage is limited to Markdown and HTML in one private repo, and each change is a single revertable commit.
- The brain's history gets noisier, especially with artifact versions.

## Alternatives Considered
- **Keep approval on `write_page`, skip it for `out/` only**: still a click per saved page, which the owner rejected.
- **Approve only URL-sourced ingests**: possible later if injected writes become a real problem.
