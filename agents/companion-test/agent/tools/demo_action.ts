import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";

// Exercises the approvals UI (E2-US06): a side effect outside the brain, so it needs approval.
export default defineTool({
  description: "Run a harmless demo action that needs approval first.",
  inputSchema: z.object({ label: z.string() }),
  approval: always(),
  async execute({ label }) {
    return { ran: true, label };
  },
});
