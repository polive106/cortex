import type { WikiStore } from "../ports/wiki-store";

export class ListPages {
  constructor(private readonly store: WikiStore) {}

  execute(): Promise<string[]> {
    return this.store.listPages();
  }
}
