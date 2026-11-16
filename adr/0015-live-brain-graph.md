# ADR-0015: Live brain graph with d3-force, polled by head commit

## Status

Accepted

## Context

The brain is a wiki of pages that link to each other (ADR-0004), and its only view is GitHub's file list. Users want to see its shape: which pages are hubs, which are leaves, what changed. That view should update while companion writes, and later show companion moving through the brain during a turn (E7-US02).

Three things were missing. Nothing parsed the links between pages. Page bodies use links relative to the page (`[Ada](people/ada.md)`), while `index.md` and chat replies use `wiki/...` from the root. Nothing exposed the brain's current version, so a client couldn't tell cheaply whether anything had changed. And no graph library was installed.

## Decision

- **Domain**: `BrainGraph.build(index.md, pages)` returns nodes and undirected edges. The index node is a hub linked to every page `index.md` lists. Page links resolve against the linking page's folder, or from the root for `wiki/...` and `/wiki/...` links. Links that go outside the repo, to `raw/`, to missing pages, or back to the same page are dropped.
- **Port**: `WikiStore.head()` returns the current head commit. GitHub reads `GET /git/ref/heads/<branch>`, and the in-memory twin returns its last ref (`memory-0` before any commit).
- `ReadBrainGraph` caches the graph by head. Polling an unchanged brain costs one GitHub request, not one per page.
  - That head lookup is reused for 2 s and shared with any build already in flight, so many open tabs cost about one lookup per window.
  - Hidden tabs don't poll.
- **Route**: `GET /eve/<agent>/brain/graph` sits behind `WEB_AUTH` and is mounted by `vercel.ts` like `/artifacts`. It returns `{ ref, nodes, edges }`, with the head as the `ETag`, and answers `304` to a matching `If-None-Match`.
- **Live updates by polling**: the web page polls every 5 s and on window focus. eve channels have no server push we could subscribe to, and a 304 is cheap.
- **Layout with `d3-force`**: one small package with no DOM coupling. The web app renders SVG itself, in a props-only widget (ADR-0003).
  - The first layout is computed before the first paint.
  - On updates, existing nodes keep their places and new nodes start next to a neighbour.
- **Screen**: the graph is its own route, `/brain`, linked from the session sidebar.
  - Interactions: pan, zoom (wheel or pinch), drag, hover to highlight neighbours, search, and click to open the page on GitHub.
- **Agent trail (E7-US02)**: the chat derives the agent's path from its own tool calls (`read_page` inputs, `search_wiki` hits, `write_page` changes), with no new route.
  - A panel beside the chat draws the path as hops between pages, coloured by action.
  - It polls the graph only while open. Closed, it stays mounted so the layout survives.
  - After a write, it reloads until the graph reaches the commit `write_page` returned.
  - During a turn it follows the agent, gliding to each new step's page, and eases back out to the whole brain when the turn ends (E7-US03).
- `BRAIN_SEED=sample`, with `BRAIN_STORE=memory`, seeds a linked example brain for demos and screenshots.

## Consequences

### Positive
- The brain's structure can be seen at a glance, and a write shows up within seconds.
- Polling an unchanged brain is one cheap request per client every 5 s.
- The link parser is in the domain, so a future lint ("orphan pages", "broken links") can reuse it.

### Negative
- Rebuilding after a commit reads every page from GitHub, which is fine at hundreds of pages but not at thousands.
- Polling adds up to 5 s of latency, and several open tabs each poll.
- The graph is drawn in a fixed dark style that doesn't follow the light theme.

## Alternatives Considered
- **Server-sent events or WebSockets**: lower latency, but eve channels don't offer a stream we could keep open across serverless invocations.
- **react-force-graph, Cytoscape or Sigma**: more features, but much larger bundles and canvas or WebGL rendering that's harder to test and style. d3-force plus SVG is enough for a brain of this size.
- **Hashing all pages for the ETag**: needs a full read of the brain on every poll.
