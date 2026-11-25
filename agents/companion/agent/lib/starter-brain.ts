/**
 * The brain's starting files (E3-US01). They seed the in-memory store until the real
 * brain repo exists, and the bootstrap pushes the same files there.
 */

const SCHEMA = `# Brain schema

This repo is a team wiki that companion maintains. Every write is one commit, so any change can
be reverted. These rules say how pages are written. Companion reads them on every turn.

## Layout

- \`wiki/\` holds the pages companion maintains. It is the only place pages live.
- \`raw/\` holds immutable sources: pasted text, fetched pages, Slack threads. Never edit a file
  here; a new version of a source is a new file. A second source with the same title on the same
  day gets the next number: \`raw/2026-11-14-deploy-notes-2.md\`.
- \`index.md\` has one line per page and stays in sync with \`wiki/\`.
- \`log.md\` is an append-only record of every ingest, query, and lint.

## Never store secrets

Never write credentials, tokens, passwords, API keys, private keys, or connection strings to
any file here, including \`raw/\`. If a source contains one, replace it with \`[redacted]\`
before saving. That is the only edit a raw source may get.

## Pages

- Path: \`wiki/<kebab-case-slug>.md\`. Optional subfolders group pages by kind, for example
  \`wiki/people/ada-lovelace.md\` or \`wiki/projects/cortex.md\`.
- One topic per page. Prefer updating an existing page to creating a near-duplicate.
- Frontmatter, in this order:

  \`\`\`
  ---
  title: Human-readable title
  summary: One line, under 120 characters, that says what the page covers
  sources:
    - raw/YYYY-MM-DD-<slug>.md
  updated: YYYY-MM-DD
  ---
  \`\`\`

- The body is Markdown and starts with the facts. Keep claims that come from a source next to a
  link to it.

## Links

- Link pages with relative links: \`[Deploys](deploys.md)\`, or \`[Ada](people/ada-lovelace.md)\`
  from the wiki root.
- Cite sources with a relative link to the raw file: \`[source](../raw/2026-11-14-deploy-notes.md)\`.
- Don't link outside the repo unless the source itself is a URL.

## Merge over append

When new information touches an existing page, rewrite that page as one coherent document.
Fold the new facts in, fix what they contradict, and keep the earlier sources in \`sources\`.
Never append a "new notes" section.

## index.md

One line per page, in this exact format:

\`\`\`
- [Title](wiki/path.md) — one-line summary
\`\`\`

## log.md

Each entry is a heading plus what changed:

\`\`\`
## [YYYY-MM-DD] ingest | <source title>

- source raw/YYYY-MM-DD-<slug>.md
- create wiki/<page>.md
- update wiki/<page>.md
\`\`\`
`;

const WELCOME = `---
title: Welcome to the brain
summary: What this wiki is and how companion keeps it
sources: []
updated: 2026-11-14
---

This is the team's brain: a wiki that companion keeps up to date. Ask companion about anything
written here and it answers from these pages. When you share something worth keeping, companion
saves it as one commit and tells you what changed.
`;

export const STARTER_BRAIN: Readonly<Record<string, string>> = {
  "AGENTS.md": SCHEMA,
  "index.md":
    "# Index\n\n- [Welcome to the brain](wiki/welcome.md) — What this wiki is and how companion keeps it\n",
  "log.md": "# Log\n",
  "wiki/welcome.md": WELCOME,
  "raw/.gitkeep": "",
};
