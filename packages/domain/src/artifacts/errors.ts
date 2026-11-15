import { WikiError } from "../wiki/errors";

/** The artifact's source breaks a rule (ADR-0012), such as loading an external script. */
export class InvalidArtifactError extends WikiError {}

export class ArtifactNotFoundError extends WikiError {
  constructor(readonly path: string) {
    super(`No artifact at ${path}`);
  }
}
