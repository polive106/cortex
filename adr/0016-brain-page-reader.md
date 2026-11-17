# ADR-0016: Reading brain pages in the web app

## Status

Accepted

## Context

The brain graph (ADR-0015) shows the brain's shape, but reading a page meant leaving for GitHub: a click on a node or on a citation in a reply opened the file there. Users want to read the page companion just read or wrote, the node they clicked, or the page a reply cites, beside the chat (E7-US04).

The web app had no way to fetch a page's text. Page bodies are markdown written by companion from untrusted sources (ADR-0004), so rendering them carries the same risks as rendering a reply. Their links are relative to the page, which the domain's link parser already resolves for the graph.

## Decision

- **Domain**: `ReadBrainPage.execute(path)` returns `{ ref, path, title, summary, updated, body }` for `index.md` or a valid `PagePath`, and nothing else in the repo. `resolvePageLink(from, href)`, the resolver behind the graph's edges, is exported so the web resolves page links the same way.
- **Route**: `GET /eve/<agent>/brain/page?path=` sits behind `WEB_AUTH` and is mounted by `vercel.ts` like `/brain/graph`. It answers 400 for a path outside the brain's pages and 404 for a missing page. It isn't cached (`no-store`): the reader reloads the page when the graph's head commit moves.
- **Reader**: the chat's brain panel shows the graph on top and the page below.
  - It follows the page the agent last read or wrote, while following is on (E7-US03).
  - A click on a node opens it in the reader. The `/brain` screen gets the same reader in a pane.
  - A plain click on a citation opens the brain panel on that page, and the artifact preview steps aside. A modified click still opens GitHub. Citations and the brain panel are separate features, so the chat passes the request through a React context in `apps/web/lib/brain-reader-context.tsx`.
- **Rendering**: Streamdown with the default `raw`, `sanitize` and `harden` plugins, plus a plugin after sanitizing that turns links to other brain pages into in-reader buttons. Every other URL goes through `safeMarkdownUrl`, so page text can't load remote images or make bare relative links, as in replies.
- **Node clicks**: the graph captures the pointer for a node only once a drag starts. Captured from `pointerdown`, the browser sent the click to the `<svg>`, so node clicks never fired in a real browser.

## Consequences

### Positive
- Pages can be read in context, with the agent's path above them.
- Only `index.md` and `wiki/` pages can be read through the route; `AGENTS.md`, `raw/` and `out/` stay out.
- Page markdown gets the same URL policy and sanitizing as model replies.

### Negative
- Each page view reads the page from GitHub (one request), and again whenever the head moves while it's open.
- Pages stored before `PagePath`'s rules (not kebab-case) have a node but can't be opened in the reader; the GitHub link still works.

## Alternatives Considered
- **Fetching from GitHub in the browser**: would need a token in the client, or a public brain repo.
- **Sending page bodies with the graph**: one request, but every 5 s poll after a change would carry the whole brain.
- **Rendering the page in a sandboxed iframe, like artifacts**: stronger isolation, but in-reader page links and theming would need `postMessage` plumbing. Sanitized markdown is what replies already use.
