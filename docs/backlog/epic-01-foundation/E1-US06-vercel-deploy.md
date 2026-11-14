# E1-US06: Vercel link and first deploy

**User Story**: As the repo owner, I want the scaffolded companion deployed on my personal Vercel account so that the deploy pipeline is proven before features land.

**Acceptance Criteria**:
- [x] The Vercel CLI is upgraded from 31.2.2 to a version that supports `vercel connect` (65.16.0, installed under Node 26)
- [x] `eve link` connects the repo to a Vercel project in the owner's personal hobby scope, `polive106s-projects` (Vercel refuses the bare personal account `polive106` as a scope; the owner approved this on 2026-11-14)
- [x] The agent uses the owner's Anthropic key, not the AI Gateway, before the first deploy (E2-US02)
- [x] `eve deploy` deploys the workspace, and the companion's routes respond at `/eve/companion/v1/*`
- [x] Browser requests without auth are rejected; there is no public access
- [x] Pushing to `main` triggers a deploy through the GitHub integration (verified by the push of d6dfea1 on 2026-11-14)

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Deploy | Link the project | `eve link --non-interactive --project cortex` |
| Deploy | First deploy | `eve deploy --non-interactive --yes` |
| Docs | Document deploy and env vars | `AGENTS.md` (commands section) |

**Dependencies**: E1-US05, E2-US02

**Complexity**: S

**Status**: Done

**Test Scenarios**:
```gherkin
Scenario: Deployed agent rejects anonymous browser calls
  Given the production deployment
  When I POST /eve/companion/v1/session without credentials
  Then the response is 401 or 403

Scenario: Push deploys
  Given a commit pushed to main
  When the Vercel GitHub integration runs
  Then a new production deployment is ready
```
