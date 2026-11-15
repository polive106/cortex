# E5: Artifacts

Companion builds HTML artifacts (reports, dashboards, one-pagers) in its sandbox, styled with the same shadcn design system as the web app. Each change in the conversation publishes a new version: one commit to `out/` in the brain, `out/<project>/<slug>.html` or `out/<slug>.html`. A preview panel on the right of the chat shows the latest version and lets you step back through earlier ones. Brain writes no longer wait for approval (ADR-0011); the artifact design is in ADR-0012.

| ID | Title | Complexity | Status |
|----|-------|------------|--------|
| E5-US01 | Brain writes without approval | S | Done |
| E5-US02 | Artifact domain | M | Done |
| E5-US03 | Tailwind artifact builder and artifact listing | M | Done |
| E5-US04 | Sandbox and shadcn design kit | M | Done |
| E5-US05 | Artifact tools and route | M | Done |
| E5-US06 | Artifact preview panel | M | Pending |
| E5-US07 | Artifact flow evals and E2E | M | Pending |
