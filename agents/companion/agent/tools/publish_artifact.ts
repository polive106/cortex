import { ArtifactPath, InvalidArtifactError } from "@cortex/domain";
import { defineTool } from "eve/tools";
import { z } from "zod";
import { container } from "../container";
import { artifactSourcePath } from "../lib/artifact-files";
import { wikiResult } from "../lib/wiki-result";

// No approval (ADR-0011): each publish is one commit in the brain, revertable like any other.
export default defineTool({
  description:
    "Publish the page at artifacts/<slug>/index.html in the sandbox as the next version of the artifact, saved to the brain at out/<project>/<slug>.html (or out/<slug>.html) and shown in the preview panel. Call it after every change. See the artifacts skill.",
  inputSchema: z.object({
    slug: z.string().describe("kebab-case name, also the sandbox folder: artifacts/<slug>/"),
    title: z.string().min(1).describe("Human-readable title for the log and the preview"),
    project: z
      .string()
      .optional()
      .describe("kebab-case slug of the project this belongs to, if any"),
  }),
  async execute({ slug, title, project }, ctx) {
    return wikiResult(async () => {
      ArtifactPath.of(slug, project); // a bad slug never reaches the sandbox
      const sandbox = await ctx.getSandbox();
      const file = artifactSourcePath(slug);
      const source = await sandbox.readTextFile({ path: file });
      if (source === null) {
        throw new InvalidArtifactError(`Write the page to ${file} first, then publish it`);
      }
      const result = await container().publishArtifact.execute({ slug, project, title, source });
      return { published: true as const, ...result };
    });
  },
});
