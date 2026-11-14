# E3: Brain (Karpathy LLM wiki)

The companion reads from and, with approval, writes to a Karpathy-style LLM wiki in the private `polive106/brain` repo:
- `AGENTS.md` and `index.md` are recalled every turn, and pages are opened on demand.
- Answers cite pages.
- Ingestion (pasted text or a URL) saves the raw source, merges it into pages, updates the index and log, and commits once to `main`.

| ID | Title | Complexity | Status |
|----|-------|------------|--------|
| E3-US01 | Brain repo bootstrap | S | Pending |
| E3-US02 | Domain entities and ports | M | Done |
| E3-US03 | Wiki use-cases | L | Done |
| E3-US04 | In-memory and GitHub wiki store adapters | L | Pending |
| E3-US05 | Wiki tools with approval on writes | M | Pending |
| E3-US06 | Recall of AGENTS.md and index.md every turn | M | Pending |
| E3-US07 | URL fetching and pasted-text ingestion | M | Pending |
| E3-US08 | Citations in answers and the web UI | S | Pending |
| E3-US09 | Real-model behavior evals | M | Pending |
