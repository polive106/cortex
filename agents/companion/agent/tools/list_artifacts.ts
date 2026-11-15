import { defineTool } from "eve/tools";
import { z } from "zod";
import { container } from "../container";

export default defineTool({
  description: "List every HTML artifact in the brain (paths under out/).",
  inputSchema: z.object({}),
  async execute() {
    return { artifacts: await container().listArtifacts.execute() };
  },
});
