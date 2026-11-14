# E1-US05: GitHub repo and CI workflow

**User Story**: As the repo owner, I want cortex in a private GitHub repo with CI on every push so that `main` stays green even if a local hook is skipped.

**Acceptance Criteria**:
- [ ] Private repo `polive106/cortex` exists, with `main` pushed
- [ ] `.github/workflows/ci.yml` runs on push and pull requests to `main`:
  - [ ] installs with `--frozen-lockfile`, on Node from `.nvmrc`
  - [ ] runs `pnpm lint`, `pnpm typecheck`, `pnpm test`
- [ ] Dependabot is configured for npm and GitHub Actions
- [ ] The first CI run is green

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| CI | Workflow | `.github/workflows/ci.yml` |
| CI | Dependency updates | `.github/dependabot.yml` |
| Repo | Create and push | `gh repo create polive106/cortex --private` |

**Dependencies**: E1-US01, E1-US02

**Complexity**: S

**Status**: In Progress

**Test Scenarios**:
```gherkin
Scenario: CI catches a failing test
  Given a commit pushed with a failing unit test
  When CI runs
  Then the test job fails and gh run view shows the failing test

Scenario: Lockfile drift
  Given package.json changed without pnpm-lock.yaml
  When CI runs
  Then install fails on --frozen-lockfile
```
