import { defineAgent } from "eve";
import { mockModel } from "eve/evals";

// Deterministic double of companion for flow evals and E2E (E2-US05). No provider calls, no key.
// Scripted replies:
// - "ping" gets the reply "pong";
// - "demo approval" calls demo_action, which needs approval (E2-US06);
// - anything else gets an echo.
export default defineAgent({
  model: mockModel({
    modelId: "companion-test",
    provider: "cortex-fixtures",
    respond: ({ lastUserMessage, toolResults }) => {
      const demoResult = toolResults.find((result) => result.name === "demo_action");
      if (demoResult) {
        return demoResult.isError
          ? "OK, I won't run the demo action."
          : `Demo action done: ${JSON.stringify(demoResult.output)}`;
      }
      const message = (lastUserMessage ?? "").trim().toLowerCase();
      if (message === "ping") return "pong";
      if (message === "demo approval") {
        return { toolCalls: [{ name: "demo_action", input: { label: "demo" } }] };
      }
      return `echo: ${lastUserMessage ?? ""}`;
    },
  }),
});
