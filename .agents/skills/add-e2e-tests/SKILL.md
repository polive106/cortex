---
name: add-e2e-tests
description: Write Playwright E2E tests for user-visible web behavior using data-testid selectors only.
---

E2E runs on **pre-push** and in CI (`pnpm test:e2e`), against the web app plus a `mockModel` test agent and in-memory brain — never a real model or the real brain repo.

## Selectors: `data-testid` only

No `getByRole`, `getByLabel`, `getByText`. Naming: `{page}-{type}-{name}` in kebab-case.

| Type | Example |
|------|---------|
| input | `chat-input-message` |
| btn | `chat-btn-send`, `chat-btn-approve` |
| link | `chat-link-citation-{slug}` |
| alert | `login-alert-error` |
| row | `chat-row-message-{index}` |

Add the attribute in the widget, then use `page.getByTestId(...)`.

## Layout

```
e2e/
  tests/<feature>/<scenario>.spec.ts
  fixtures/        sign-in helper, test agent URL, brain seed
playwright.config.ts
```

## Steps

1. Map each acceptance criterion with UI impact to one scenario.
2. Sign in through the fixture (local auth bypass for the allowlisted test email), not by hand.
3. Seed the in-memory brain via the fixture when the scenario reads the wiki.
4. Assert visible outcomes: message rendered, approval card shown, citation link present.
5. Run `pnpm test:e2e` (headed: `pnpm test:e2e --headed`). First run: `pnpm exec playwright install --with-deps chromium`.

## Must-have scenarios per feature

Happy path, validation error, unauthorized user (not on `ALLOWED_EMAILS`) is rejected, and for brain writes: page saved and cited; a path outside wiki/ refused.
