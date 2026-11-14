import { defineEval } from "eve/evals";

// Park on an approval, then resume with each answer (E2-US06).
export default [
  defineEval({
    description: "Approving demo_action runs it and the agent continues.",
    async test(t) {
      const parked = await t.send("demo approval");
      parked.awaitingInput();
      parked.session.requireInteraction({ toolName: "demo_action" });
      const resumed = await parked.session.respondAll("approve");
      resumed.succeeded();
      resumed.calledTool("demo_action", { status: "completed" });
      resumed.messageIncludes("Demo action done");
    },
  }),
  defineEval({
    description: "Denying demo_action never runs it and the agent acknowledges.",
    async test(t) {
      const parked = await t.send("demo approval");
      parked.awaitingInput();
      const resumed = await parked.session.respondAll("deny");
      resumed.succeeded();
      resumed.messageIncludes("won't run the demo action");
    },
  }),
];
