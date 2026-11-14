import {
  type Changeset,
  type CommitResult,
  ConflictError,
  isPagePath,
  type WikiFile,
  type WikiStore,
} from "@cortex/domain";

/** WikiStore twin for local dev, evals, and tests. Commits are kept so tests can inspect them. */
export class InMemoryWikiStore implements WikiStore {
  private readonly files: Map<string, string>;
  readonly commits: { readonly ref: string; readonly message: string; readonly paths: string[] }[] =
    [];

  constructor(seed: Record<string, string> = {}) {
    this.files = new Map(Object.entries(seed));
  }

  async readFile(path: string): Promise<string | null> {
    return this.files.get(path) ?? null;
  }

  async listPages(): Promise<string[]> {
    return [...this.files.keys()].filter(isPagePath).sort();
  }

  async readPages(): Promise<WikiFile[]> {
    return (await this.listPages()).map((path) => ({
      path,
      content: this.files.get(path) as string,
    }));
  }

  async commit(changeset: Changeset, message: string): Promise<CommitResult> {
    if (changeset.isEmpty) throw new Error("Refusing to commit an empty changeset");
    const clash = changeset.files.find((file) => file.mustNotExist && this.files.has(file.path));
    if (clash) throw new ConflictError(`${clash.path} already exists`);
    for (const { path, content } of changeset.files) this.files.set(path, content);
    const ref = `memory-${this.commits.length + 1}`;
    this.commits.push({ ref, message, paths: changeset.paths });
    return { ref };
  }
}
