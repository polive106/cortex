import { defineTool } from "eve/tools";
import { z } from "zod";
import { container } from "../container";
import { wikiResult } from "../lib/wiki-result";

const inputSchema = z.object({
  source: z.object({
    title: z.string().min(1).describe("Short title of the source"),
    origin: z.string().min(1).describe('Where it came from: a URL, or "pasted"'),
    text: z.string().min(1).describe("The source text exactly as given, unedited"),
  }),
  pages: z
    .array(
      z.object({
        path: z
          .string()
          .optional()
          .describe(
            "wiki/<kebab-slug>.md. Omit to derive it from the title. Reuse existing paths to update.",
          ),
        title: z.string().min(1),
        summary: z.string().min(1).describe("One line for index.md"),
        body: z
          .string()
          .min(1)
          .describe("The page's full new Markdown body. For updates, merge with the old content."),
      }),
    )
    .min(1),
});

// No approval (ADR-0011): every write is one commit, and git revert is the undo.
export default defineTool({
  description:
    "Save knowledge to the brain: the raw source plus created or updated pages, as one commit. It saves immediately; tell the person what you saved.",
  inputSchema,
  async execute({ source, pages }) {
    return wikiResult(async () => {
      const result = await container().ingest.execute({ source, pages });
      return { committed: true as const, ...result };
    });
  },
});
