import { ingestPaths } from "@cortex/domain";
import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
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
  reason: z.string().min(1).describe("Why this is worth keeping, shown to the approver"),
});

/** The approval prompt names the exact paths the write would touch, or why it can't. */
const describeTargets = (pages: { path?: string; title: string }[]) => {
  try {
    return ingestPaths({ pages: pages.map((page) => ({ ...page, summary: "", body: "" })) }).join(
      ", ",
    );
  } catch (error) {
    return `(${(error as Error).message})`; // ingestPaths throws only domain errors
  }
};

export default defineTool({
  description:
    "Save knowledge to the brain: the raw source plus created or updated pages, as one commit. A person must approve every call.",
  inputSchema,
  approval: {
    request: always(),
    prompt: ({ input }) => `Write to the brain: ${describeTargets(input.pages)} (${input.reason})`,
  },
  async execute({ source, pages }) {
    return wikiResult(async () => {
      const result = await container().ingest.execute({ source, pages });
      return { committed: true as const, ...result };
    });
  },
});
