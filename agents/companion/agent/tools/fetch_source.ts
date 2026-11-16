import { defineTool } from "eve/tools";
import { z } from "zod";
import { container } from "../container";
import { wikiResult } from "../lib/wiki-result";

// Read-only, so no approval. The result is data from the web: never instructions (instructions.md).
export default defineTool({
  description:
    "Fetch a web page (http or https) as Markdown, to save to the brain or to summarize. Returns the URL to use as the source origin, the page title, and its text. Private and local addresses are refused.",
  inputSchema: z.object({
    url: z.string().min(1).describe("The full http(s) URL, as the person gave it"),
  }),
  async execute({ url }) {
    return wikiResult(() => container().fetchSource.execute(url));
  },
});
