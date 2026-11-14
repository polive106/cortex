import { defineTool } from "eve/tools";
import { z } from "zod";
import { container } from "../container";

export default defineTool({
  description:
    "Search brain pages by words. Returns ranked paths with snippets. Search before proposing a write, so you update an existing page instead of duplicating it.",
  inputSchema: z.object({
    query: z.string().describe("Words to look for"),
    limit: z.number().int().min(1).max(25).optional(),
  }),
  async execute({ query, limit }) {
    return { results: await container().searchWiki.execute(query, limit) };
  },
});
