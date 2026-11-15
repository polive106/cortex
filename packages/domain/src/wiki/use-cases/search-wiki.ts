import { Page } from "../entities/page";
import { PagePath } from "../entities/page-path";
import { collapseWhitespace } from "../entities/text";
import type { WikiStore } from "../ports/wiki-store";

export interface SearchHit {
  readonly path: string;
  readonly title: string;
  readonly snippet: string;
  readonly score: number;
}

const MIN_TERM_LENGTH = 2;
const SNIPPET_RADIUS = 80;
const TITLE_BOOST = 3;

const count = (haystack: string, needle: string) => haystack.split(needle).length - 1;

/** Plain text search over wiki pages: term hits, title matches boosted. No vectors (ADR-0004). */
export class SearchWiki {
  constructor(private readonly store: WikiStore) {}

  async execute(query: string, limit = 10): Promise<SearchHit[]> {
    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term.length >= MIN_TERM_LENGTH);
    if (terms.length === 0) return [];
    const files = await this.store.readPages();
    const hits = files.flatMap(({ path, content }) => {
      const pagePath = PagePath.tryParse(path);
      if (!pagePath) return []; // only well-formed wiki pages are searchable
      const page = Page.parse(pagePath, content);
      const body = page.body.toLowerCase();
      const title = page.title.toLowerCase();
      const score = terms.reduce(
        (total, term) => total + count(body, term) + TITLE_BOOST * count(title, term),
        0,
      );
      return score === 0
        ? []
        : [{ path, title: page.title, snippet: snippet(page.body, terms), score }];
    });
    return hits.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path)).slice(0, limit);
  }
}

function snippet(body: string, terms: readonly string[]): string {
  const lower = body.toLowerCase();
  const positions = terms.map((term) => lower.indexOf(term)).filter((at) => at !== -1);
  const at = positions.length > 0 ? Math.min(...positions) : 0;
  const start = Math.max(0, at - SNIPPET_RADIUS);
  const end = Math.min(body.length, at + SNIPPET_RADIUS);
  const text = collapseWhitespace(body.slice(start, end));
  return `${start > 0 ? "…" : ""}${text}${end < body.length ? "…" : ""}`;
}
