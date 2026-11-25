# E3: Brain (Karpathy LLM wiki)

The companion reads from and writes to (without approval, ADR-0011) a Karpathy-style LLM wiki in a private brain repo (`BRAIN_REPO`):
- `AGENTS.md` and `index.md` are recalled every turn, and pages are opened on demand.
- Answers cite pages.
- Ingestion (pasted text, a URL, or an attached PDF or image) saves the raw source, merges it into pages, updates the index and log, and commits once to `main`.

| ID | Title | Complexity | Status |
|----|-------|------------|--------|
| E3-US01 | Brain repo bootstrap | S | Done |
| E3-US02 | Domain entities and ports | M | Done |
| E3-US03 | Wiki use-cases | L | Done |
| E3-US04 | In-memory and GitHub wiki store adapters | L | Done |
| E3-US05 | Wiki tools with approval on writes | M | Done |
| E3-US06 | Recall of AGENTS.md and index.md every turn | M | Done |
| E3-US07 | URL fetching and pasted-text ingestion | M | Done |
| E3-US08 | Citations in answers and the web UI | S | Done |
| E3-US09 | Real-model behavior evals | M | Pending |
| E3-US10 | PDF and image attachments in web chat | M | Done |
