import {
  type Changeset,
  type CommitResult,
  ReadOnlyBrainError,
  type WikiFile,
  type WikiStore,
} from "@cortex/domain";

/** Serves reads from another store and refuses every write, explaining why. */
export class ReadOnlyWikiStore implements WikiStore {
  constructor(
    private readonly inner: WikiStore,
    private readonly reason: string,
  ) {}

  readFile(path: string, ref?: string): Promise<string | null> {
    return this.inner.readFile(path, ref);
  }

  listPages(): Promise<string[]> {
    return this.inner.listPages();
  }

  listArtifacts(): Promise<string[]> {
    return this.inner.listArtifacts();
  }

  readPages(): Promise<WikiFile[]> {
    return this.inner.readPages();
  }

  async commit(_changeset: Changeset, _message: string): Promise<CommitResult> {
    throw new ReadOnlyBrainError(`${this.reason}; nothing was saved`);
  }
}
