import { INDEX_NODE } from "../entities/brain-graph";
import { PageNotFoundError } from "../errors";
import type { WikiStore } from "../ports/wiki-store";
import { ReadPage } from "./read-page";

/** A brain page as the web reader shows it (E7-US04). */
export interface BrainPageView {
  /** The head commit when the page was read. */
  readonly ref: string;
  /** `index.md` or `wiki/<kebab>.md`. */
  readonly path: string;
  readonly title: string;
  readonly summary: string;
  /** YYYY-MM-DD, or empty for the index. */
  readonly updated: string;
  /** Markdown, without frontmatter. */
  readonly body: string;
}

/**
 * One page of the brain, or its index, for the reader beside the graph (E7-US04). Nothing else
 * in the repo is readable: anything but index.md must be a valid PagePath.
 */
export class ReadBrainPage {
  private readonly readPage: ReadPage;

  constructor(private readonly store: WikiStore) {
    this.readPage = new ReadPage(store);
  }

  /** Throws InvalidPathError outside index.md and wiki/, PageNotFoundError if it's missing. */
  async execute(path: string): Promise<BrainPageView> {
    if (path === INDEX_NODE) {
      const [ref, body] = await Promise.all([this.store.head(), this.store.readFile(INDEX_NODE)]);
      if (body === null) throw new PageNotFoundError(INDEX_NODE);
      return { ref, path, title: "Index", summary: "", updated: "", body };
    }
    const [ref, page] = await Promise.all([this.store.head(), this.readPage.execute(path)]);
    const { title, summary, updated, body } = page;
    return { ref, path: page.path.value, title, summary, updated, body };
  }
}
