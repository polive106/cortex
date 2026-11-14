import { Page } from "../entities/page";
import { PagePath } from "../entities/page-path";
import { PageNotFoundError } from "../errors";
import type { WikiStore } from "../ports/wiki-store";

export class ReadPage {
  constructor(private readonly store: WikiStore) {}

  /** Throws InvalidPathError for anything outside wiki/, PageNotFoundError if it's missing. */
  async execute(path: string): Promise<Page> {
    const pagePath = PagePath.parse(path);
    const markdown = await this.store.readFile(pagePath.value);
    if (markdown === null) throw new PageNotFoundError(pagePath.value);
    return Page.parse(pagePath, markdown);
  }
}
