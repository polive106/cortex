---
name: discuss-feature
description: Interview-driven exploration of a feature idea until there's shared understanding, then turn it into backlog stories.
---

## Phase 1: Interview

Ask **one question at a time**, each with your recommended answer. Look facts up yourself (code, ADRs, eve docs in `node_modules/eve/docs`); put only decisions to the user.

Probe:

- **Who**: you in the web UI, a Slack user, a scheduled job, another agent?
- **What**: exact behavior, edge cases, failure modes.
- **Brain impact**: does it read or write the wiki? Does it change the brain schema (`AGENTS.md` in `polive106/brain`)? Does a write need approval?
- **Security**: what secrets/credentials are involved; can the model ever see them? Who is allowed to trigger it?
- **Cost**: extra model calls, context size, real-model evals needed?
- **Scope**: what's explicitly out.

Challenge over-engineering. Track open questions and revisit them before Phase 2.

## Phase 2: Synthesis

Summarize: name, description, acceptance criteria (checkboxes), affected layers, ADR impact (new ADR needed?), dependencies, complexity (XS–XL). Get confirmation.

## Phase 3: Backlog

Propose epic/story IDs and order. On approval, run `create-story` for each. If a decision is architectural, run `add-adr` too.
