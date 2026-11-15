import {
  type Changeset,
  type CommitResult,
  ConflictError,
  isArtifactPath,
  isPagePath,
  type WikiFile,
  type WikiStore,
} from "@cortex/domain";

/** WikiStore twin for local dev, evals, and tests. Commits are kept so tests can inspect them. */
export class InMemoryWikiStore implements WikiStore {
  private readonly files: Map<string, string>;
  /** The files as of each commit, so a version can be read back by its ref. */
  private readonly snapshots = new Map<string, ReadonlyMap<string, string>>();
  readonly commits: { readonly ref: string; readonly message: string; readonly paths: string[] }[] =
    [];

  constructor(seed: Record<string, string> = {}) {
    this.files = new Map(Object.entries(seed));
  }

  async readFile(path: string, ref?: string): Promise<string | null> {
    const files = ref === undefined ? this.files : this.snapshots.get(ref);
    return files?.get(path) ?? null;
  }

  async listPages(): Promise<string[]> {
    return [...this.files.keys()].filter(isPagePath).sort();
  }

  async listArtifacts(): Promise<string[]> {
    return [...this.files.keys()].filter(isArtifactPath).sort();
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
    this.snapshots.set(ref, new Map(this.files));
    return { ref };
  }
}
