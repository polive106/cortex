import type { Changeset } from "../entities/changeset";

export interface WikiFile {
  readonly path: string;
  readonly content: string;
}

export interface CommitResult {
  /** The commit id (a git SHA for the GitHub store). */
  readonly ref: string;
}

/** The brain repo, narrowed to what wiki use-cases need (ADR-0004, ADR-0005). */
export interface WikiStore {
  /**
   * A file's content, or null when it doesn't exist. With `ref` (a ref a commit returned), the
   * content as of that commit; null when the ref is unknown.
   */
  readFile(path: string, ref?: string): Promise<string | null>;
  /** Every page path under `wiki/` (`.md` files only), sorted. */
  listPages(): Promise<string[]>;
  /** Every artifact path under `out/` (`.html` files only), sorted (ADR-0012). */
  listArtifacts(): Promise<string[]>;
  /** Every page under `wiki/` with its content, sorted by path. */
  readPages(): Promise<WikiFile[]>;
  /**
   * Applies every write as exactly one commit on the current head. Throws ConflictError, and
   * writes nothing, when a `mustNotExist` file exists on that head or the head moved meanwhile.
   * Callers retry by re-reading and re-planning, never by replaying the same changeset.
   */
  commit(changeset: Changeset, message: string): Promise<CommitResult>;
}
