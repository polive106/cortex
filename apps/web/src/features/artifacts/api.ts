import type { EveMessage } from "eve/react";

/** One artifact version shown in the preview: a completed publish_artifact or open_artifact. */
export interface ArtifactVersion {
  /** The tool call that produced it. */
  readonly id: string;
  readonly path: string;
  readonly title: string;
  readonly version: number;
  /** The commit holding this version; absent means the artifact's latest file. */
  readonly ref?: string;
}

const ARTIFACT_TOOLS = new Set(["publish_artifact", "open_artifact"]);

type ArtifactOutput = Omit<ArtifactVersion, "id">;

function isArtifactOutput(output: unknown): output is ArtifactOutput {
  if (typeof output !== "object" || output === null) return false;
  const value = output as Record<string, unknown>;
  return (
    (value.published === true || value.opened === true) &&
    typeof value.path === "string" &&
    typeof value.title === "string" &&
    typeof value.version === "number"
  );
}

/**
 * Every artifact version the conversation produced, oldest first (ADR-0012). The tool outputs
 * carry only the path, version and ref; the page itself is fetched from the agent.
 */
export function artifactVersions(messages: readonly EveMessage[]): ArtifactVersion[] {
  const versions: ArtifactVersion[] = [];
  for (const message of messages) {
    for (const part of message.parts) {
      if (part.type !== "tool" || part.state !== "completed" || !ARTIFACT_TOOLS.has(part.name)) {
        continue;
      }
      const output = part.output;
      if (!isArtifactOutput(output)) continue;
      // An unchanged publish repeats a version that's usually listed already.
      if (versions.some((v) => v.path === output.path && v.version === output.version)) continue;
      versions.push({
        id: part.callId,
        path: output.path,
        title: output.title,
        version: output.version,
        ref: output.ref,
      });
    }
  }
  return versions;
}

/** The companion route that serves one version's page (agents/companion/agent/channels). */
export function artifactUrl(agent: string, version: Pick<ArtifactVersion, "path" | "ref">): string {
  const query = new URLSearchParams({ path: version.path });
  if (version.ref) query.set("ref", version.ref);
  return `/eve/${agent}/artifacts?${query}`;
}
