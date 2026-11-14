import { defineTool } from "eve/tools";
import { z } from "zod";
import { container } from "../container";

export default defineTool({
  description:
    "List every page path in the brain (the team wiki). Use it to see what exists before reading or writing.",
  inputSchema: z.object({}),
  async execute() {
    return { pages: await container().listPages.execute() };
  },
});
