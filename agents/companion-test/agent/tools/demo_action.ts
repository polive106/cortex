import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";

// Stand-in for the brain's write_page until E3: a side effect that always needs human approval.
export default defineTool({
  description: "Run a harmless demo action that needs approval first.",
  inputSchema: z.object({ label: z.string() }),
  approval: always(),
  async execute({ label }) {
    return { ran: true, label };
  },
});
