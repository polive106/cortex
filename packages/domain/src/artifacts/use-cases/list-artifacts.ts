import type { WikiStore } from "../../wiki/ports/wiki-store";

export class ListArtifacts {
  constructor(private readonly store: WikiStore) {}

  execute(): Promise<string[]> {
    return this.store.listArtifacts();
  }
}
