import { isArtifactPath } from "../../artifacts/entities/artifact-path";
import type { Changeset } from "../entities/changeset";
import { isPagePath } from "../entities/page-path";
import { ConflictError } from "../errors";
import type { Clock } from "../ports/clock";
import type { CommitResult, WikiFile, WikiStore } from "../ports/wiki-store";

/** Minimal in-test WikiStore. The real in-memory twin lives in @cortex/adapters. */
export class FakeWikiStore implements WikiStore {
  readonly commits: { message: string; paths: string[] }[] = [];
  /** Simulates another writer moving the head: the next N commits fail with ConflictError. */
  headMovesFor = 0;
  private readonly snapshots = new Map<string, Record<string, string>>();

  constructor(readonly files: Record<string, string> = {}) {}

  async readFile(path: string, ref?: string): Promise<string | null> {
    const files = ref === undefined ? this.files : this.snapshots.get(ref);
    return files?.[path] ?? null;
  }

  async head(): Promise<string> {
    return `commit-${this.commits.length}`;
  }

  async listPages(): Promise<string[]> {
    return Object.keys(this.files).filter(isPagePath).sort();
  }

  async listArtifacts(): Promise<string[]> {
    return Object.keys(this.files).filter(isArtifactPath).sort();
  }

  async readPages(): Promise<WikiFile[]> {
    return (await this.listPages()).map((path) => ({ path, content: this.files[path] ?? "" }));
  }

  async commit(changeset: Changeset, message: string): Promise<CommitResult> {
    if (this.headMovesFor > 0) {
      this.headMovesFor--;
      throw new ConflictError("The brain moved while committing");
    }
    const clash = changeset.files.find((file) => file.mustNotExist && file.path in this.files);
    if (clash) throw new ConflictError(`${clash.path} already exists`);
    for (const { path, content } of changeset.files) this.files[path] = content;
    this.commits.push({ message, paths: changeset.paths });
    const ref = `commit-${this.commits.length}`;
    this.snapshots.set(ref, { ...this.files });
    return { ref };
  }
}

export const fixedClock = (iso = "2026-11-14T10:00:00Z"): Clock => ({ now: () => new Date(iso) });
