import type { WikiStore } from "../../wiki/ports/wiki-store";
import { Artifact } from "../entities/artifact";
import { ArtifactPath } from "../entities/artifact-path";
import { ArtifactNotFoundError } from "../errors";

export interface ReadArtifactResult {
  readonly artifact: Artifact;
  /** The published page exactly as stored. */
  readonly html: string;
}

export class ReadArtifact {
  constructor(private readonly store: WikiStore) {}

  /** The latest version, or the one in commit `ref`. Throws for paths outside out/ or missing files. */
  async execute(path: string, ref?: string): Promise<ReadArtifactResult> {
    const artifactPath = ArtifactPath.parse(path);
    const html = await this.store.readFile(artifactPath.value, ref);
    if (html === null) {
      throw new ArtifactNotFoundError(ref === undefined ? path : `${path} (${ref})`);
    }
    return { artifact: Artifact.parse(artifactPath, html), html };
  }
}
