import { KEBAB } from "../../wiki/entities/text";
import { InvalidPathError } from "../../wiki/errors";

const SEGMENT = new RegExp(`^${KEBAB}$`);

/** Whether a stored file is an artifact: an `.html` file under `out/` (looser than ArtifactPath). */
export const isArtifactPath = (path: string): boolean =>
  path.startsWith("out/") && path.endsWith(".html");

/**
 * A validated artifact location (ADR-0012): `out/<slug>.html`, or `out/<project>/<slug>.html`
 * for an artifact that belongs to a project. Nothing escapes `out/`.
 */
export class ArtifactPath {
  private constructor(
    readonly value: string,
    readonly slug: string,
    readonly project: string | undefined,
  ) {}

  static parse(input: string): ArtifactPath {
    if (!input.startsWith("out/")) throw new InvalidPathError(input, "must live under out/");
    if (!input.endsWith(".html")) throw new InvalidPathError(input, "must be an .html file");
    const segments = input.slice("out/".length, -".html".length).split("/");
    if (segments.length > 2) {
      throw new InvalidPathError(input, "use out/<slug>.html or out/<project>/<slug>.html");
    }
    if (!segments.every((segment) => SEGMENT.test(segment))) {
      throw new InvalidPathError(input, "segments must be lowercase kebab-case");
    }
    const [first, second] = segments as [string, string?];
    return second === undefined
      ? new ArtifactPath(input, first, undefined)
      : new ArtifactPath(input, second, first);
  }

  static of(slug: string, project?: string): ArtifactPath {
    return ArtifactPath.parse(project ? `out/${project}/${slug}.html` : `out/${slug}.html`);
  }
}
