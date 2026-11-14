# E1-US06: Vercel link and first deploy

**User Story**: As the repo owner, I want the scaffolded companion deployed on my personal Vercel account so that the deploy pipeline is proven before features land.

**Acceptance Criteria**:
- [ ] The Vercel CLI is upgraded from 31.2.2 to a version that supports `vercel connect`
- [ ] `eve link` connects the repo to a Vercel project under the personal scope (polive106)
- [ ] `eve deploy` deploys the workspace, and the companion's routes respond at `/eve/companion/v1/*`
- [ ] Browser requests without auth are rejected; there is no public access
- [ ] Pushing to `main` triggers a deploy through the GitHub integration

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Deploy | Link the project | `eve link --non-interactive --project cortex` |
| Deploy | First deploy | `eve deploy --non-interactive --yes` |
| Docs | Document deploy and env vars | `AGENTS.md` (commands section) |

**Dependencies**: E1-US05

**Complexity**: S

**Status**: Pending

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
