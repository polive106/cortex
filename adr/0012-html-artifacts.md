# ADR-0012: HTML artifacts in the brain's out/ folder

## Status

Accepted (2026-11-15)

## Context

People want the companion to produce good-looking HTML pages (reports, dashboards, one-pagers) that match the web app's shadcn look, see them beside the chat, and keep every version. Constraints:

- eve gives each session a sandbox for files and the `bash`/`read_file`/`write_file`/`edit_file` tools. Locally and in evals it's just-bash, which runs no native binaries, so a Tailwind CLI can't run there.
- The web client keeps a tool output only up to 16 KB (`MAX_KEPT_VALUE_LENGTH`), so a page can't travel through the chat stream.
- The HTML is model-written and may include scripts, so it must never run with the app's origin.

## Decision

- **Location**: artifacts live in the brain at `out/<project>/<slug>.html`, or `out/<slug>.html` without a project. `ArtifactPath` enforces it, and nothing escapes `out/`.
- **Authoring**: the agent writes `artifacts/<slug>/index.html` in its sandbox with Tailwind classes, following the design kit in `design/` (`theme.css`, `components.md`, `template.html`). The kit's tokens are the web app's `globals.css` tokens, and a test keeps them in sync.
- **Build**: `publish_artifact` reads the file, and the `ArtifactBuilder` port compiles only the classes the page uses with Tailwind v4's JS `compile()`, server-side. Tailwind's base CSS is embedded as a module, so nothing is read from `node_modules` at runtime.
- **Self-contained page**: the domain inserts a CSP meta (`default-src 'none'`, inline styles and scripts, `data:` images and fonts) first in `<head>`, a `cortex:version` meta, and the CSS in one marked `<style>`. External scripts, stylesheets, frames and `<base>` are refused. `Artifact.source()` strips the inserted parts so a published page can be edited again.
- **Versioning**: every publish bumps `cortex:version` and is one commit (the file plus a `log.md` entry, no approval per ADR-0011). Git history is the version history.
- **Preview**: tool outputs carry only the path, version and commit ref. The web panel fetches the page from the companion's `GET /artifacts?path&ref` route (the web chat's auth, a `sandbox` CSP header) and renders it in `<iframe sandbox="allow-scripts" srcdoc>`, with no `allow-same-origin`.

## Consequences

### Positive
- Pages look like the app, work offline, and render the same from GitHub, a download, or the panel.
- Any earlier version can be shown by its commit ref.
- The build works the same in dev, evals and production.

### Negative
- Pages can't load web fonts, remote images or CDNs.
- Tailwind's base CSS must be re-embedded when `tailwindcss` is upgraded (a test fails until it is).
- Each version adds a commit to the brain.

## Alternatives Considered
- **Tailwind CLI in the sandbox**: not possible on just-bash, so dev and evals would need Docker.
- **A fixed precompiled stylesheet**: works everywhere, but limits pages to a small class vocabulary.
- **HTML in the tool output**: more than 16 KB is dropped from the client view.
- **Iframe `src` to the route**: works, but `srcdoc` gives the panel loading and error states and never leaves the page reachable by direct navigation from the frame.
