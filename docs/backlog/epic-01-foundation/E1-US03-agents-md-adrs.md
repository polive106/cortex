# E1-US03: AGENTS.md, CLAUDE.md, and ADRs 0001–0009

**User Story**: As a coding agent, I want one authoritative rules file and a record of past decisions so that I can follow the architecture without guessing.

**Acceptance Criteria**:
- [x] `AGENTS.md` covers the project overview, stack, architecture rules (hexagonal, FSD), TDD and coverage rules, the commit process (simplify gate), the skills table, commands, and eve usage guidance
- [x] `CLAUDE.md` imports `@AGENTS.md` (one source of truth for skills and rules)
- [x] `adr/README.md` indexes ADRs 0001–0009 in MADR format:
  - [x] 0001 eve workspace layout
  - [x] 0002 lightweight hexagonal architecture over eve
  - [x] 0003 FSD on Next.js with the vendored eve/shadcn UI
  - [x] 0004 Karpathy brain in a separate repo
  - [x] 0005 fine-grained token and commits straight to main
  - [x] 0006 Vercel sign-in and email allowlist
  - [x] 0007 testing strategy and mockModel tiers
  - [x] 0008 simplify-before-commit enforcement
  - [x] 0009 tooling: pnpm without Turbo, Biome, Node 26

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Docs | Agent rules | `AGENTS.md`, `CLAUDE.md` |
| Docs | ADRs and index | `adr/0001-…` to `adr/0009-…`, `adr/README.md` |

**Dependencies**: E1-US01

**Complexity**: M

**Status**: Done

**Test Scenarios**:
```gherkin
Scenario: Skill tables in sync
  Given AGENTS.md and CLAUDE.md
  When either file is edited
  Then the sync hook reports no missing skills

Scenario: Every ADR is indexed
  Given the adr/ directory
  Then every adr/NNNN-*.md file has a row in adr/README.md
```
