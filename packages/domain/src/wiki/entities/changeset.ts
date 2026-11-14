export interface FileWrite {
  readonly path: string;
  readonly content: string;
  /** The store must refuse the whole commit if this file already exists on its head. */
  readonly mustNotExist: boolean;
}

/** The full set of file writes for one operation, applied by WikiStore as exactly one commit. */
export class Changeset {
  constructor(readonly files: readonly FileWrite[] = []) {}

  write(path: string, content: string, { mustNotExist = false } = {}): Changeset {
    if (this.files.some((file) => file.path === path)) {
      throw new Error(`Changeset writes ${path} twice`);
    }
    return new Changeset([...this.files, { path, content, mustNotExist }]);
  }

  get paths(): string[] {
    return this.files.map((file) => file.path);
  }

  get isEmpty(): boolean {
    return this.files.length === 0;
  }
}
