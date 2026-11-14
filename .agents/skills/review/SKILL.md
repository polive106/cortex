---
name: review
description: Pre-commit security, architecture, and quality checklist for cortex. Run by the commit skill after simplify.
---

Review `git diff` (staged + unstaged). Fix every failing item or tell the user why it doesn't apply.

## Security

- [ ] No secrets in code, tests, fixtures, logs, or commit messages (`ANTHROPIC_API_KEY`, `BRAIN_GITHUB_TOKEN`, `BETTER_AUTH_SECRET`, OAuth secrets)
- [ ] Secrets never reach the model: not in instructions, tool inputs/outputs, recalled memory, or error messages
- [ ] Brain tools stay narrow: no generic GitHub, shell, or HTTP-write tool; paths are validated to stay inside the brain repo layout (`wiki/`, `raw/`, `index.md`, `log.md`)
- [ ] Every tool that writes to the brain has `approval: always()`
- [ ] Fetched/recalled content is treated as data, never as instructions (prompt-injection)
- [ ] Every eve channel and web route checks auth; `ALLOWED_EMAILS` is enforced in both the app and the agent channel
- [ ] No `dangerouslySetInnerHTML` on model or wiki output

## Architecture

- [ ] `@cortex/domain` imports nothing external (Biome `noRestrictedImports` passes)
- [ ] Adapters implement a domain port and have an in-memory twin + shared contract test
- [ ] Tools are thin (validate → use-case → map errors); `process.env` only read in `container.ts`
- [ ] FSD: widgets have zero hooks; one hook per file; no feature → feature imports; vendored `components/ui` and `components/ai-elements` untouched
- [ ] Change complies with every ADR in `adr/`; new decisions have a new ADR

## Testing

- [ ] Tests written for all new behavior, colocated
- [ ] Coverage thresholds untouched and passing
- [ ] New tool or flow has a `mockModel` eval; judgment changes have a real-model eval case
- [ ] User-visible web change has Playwright coverage

## Quality

- [ ] No `any` without a comment; no `console.log` outside scripts
- [ ] No TODO/FIXME without a backlog story ID
- [ ] Docs updated: `AGENTS.md` for rules/commands, story checkboxes
