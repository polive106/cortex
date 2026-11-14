---
name: review-backlog
description: Report backlog status, detect status drift, and pick the next story to implement.
---

## Steps

1. Read `docs/backlog/README.md` (implementation order) and every `docs/backlog/epic-*/README.md`.
2. Read each story's `**Status**` and `**Dependencies**`.
3. **Drift check** for Pending / In Progress stories:
   - Key files from **Technical Tasks** already exist (`test -f`) → likely drift, flag it.
   - Story file status ≠ epic README status → flag.
   - All criteria checked but status ≠ Done → flag.
4. Next story = first non-Done story in implementation order whose dependencies are all Done.

## Output

```
## Backlog Status

### E1 Foundation (In Progress)
- [x] E1-US01: … (Done)
- [ ] E1-US06: … (Pending)

### Drift Warnings
⚠ E3-US04: Pending but 3/4 implementation files exist → run story-complete

### Next Up
E1-US06: Vercel link + first deploy (deps: E1-US05 ✓)
```
